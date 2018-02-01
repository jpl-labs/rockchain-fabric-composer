const config = require('config')
const deepstream = require('deepstream.io-client-js')
const { compose, map, prop, concat } = require('ramda')

const {
  host,
  credentials
} = config.get('deepstream')

const ds = deepstream(host).login(credentials)

const syncList = async ({
  network,
  list,
  recordName,
  idKey,
  listName,
  eventName,
  serializeRecord,
  mapEventToRecord
}) => {

  // await record creation to ensure all composer network changes are
  // properly reflected in the synced deepstream network
  await Promise.all(map(async composerRecord => {
    const record = await serializeRecord(composerRecord)

    return new Promise(resolve => {
      const id = `${recordName}/${composerRecord[idKey]}`
      const dsRecord = ds.record.getRecord(id)
      dsRecord.whenReady(() => {
        network.logger.info('DeepstreamApi::syncList', 'Record synced: ', id)
        dsRecord.set(record, resolve)
      })
    })
  }, list))

  const dsList = ds.record.getList(listName)
  dsList.whenReady(() => {
    const identifiers = map(compose(
      concat(`${recordName}/`),
      prop(idKey)
    ), list)
    
    dsList.setEntries(identifiers)

    network.on(`com.omni.biznet.${eventName}`, async evt => {
      const record = await mapEventToRecord(evt)
      const id = `${recordName}/${record[idKey]}`
      const dsRecord = ds.record.getRecord(id)
      dsRecord.whenReady(() => {
        dsRecord.set(record)
        dsList.addEntry(id)
        network.logger.info(`DeepstreamApi::on${eventName}`, `Added a ${recordName} to deepstream - id: ${id}`)
      })
    })
  })
}

const provide = async network => {
  await network.init()

  //when we start up, we need to sync up the deepstream participant and asset lists
  //with the corresponding rockchain/composer lists, and then start watching for changes
  const [users, wagers] = await Promise.all([
    network.listUsers(),
    network.listWagers()
  ])

  await Promise.all([
    syncList({
      network,
      list: users,
      recordName: 'user',
      idKey: 'email',
      listName: 'users',
      eventName: 'UserRegistered',
      serializeRecord: async ({ email, charity, balance }) => ({ email, charity, balance }),
      mapEventToRecord: async ({ email, charity, balance }) => ({ email, charity, balance })
    }),
    syncList({
      network,
      list: wagers,
      recordName: 'wager',
      idKey: 'wagerId',
      listName: 'wagers',
      eventName: 'BetPlaced',
      serializeRecord: async ({
        wagerId,
        artist,
        startingRoundNumber,
        endingRoundNumber,
        bettor: { $identifier: bettor }
      }) => ({
        wagerId,
        artist,
        startingRoundNumber,
        endingRoundNumber,
        bettor
      }),
      mapEventToRecord: async ({ wager: { $identifier: wagerId } }) => {
        const resolvedWager = await network.wagerRegistry.get(wagerId)
        return {
          wagerId: resolvedWager.wagerId,
          artist: resolvedWager.artist,
          startingRoundNumber: resolvedWager.startingRoundNumber,
          endingRoundNumber: resolvedWager.endingRoundNumber,
          bettor: resolvedWager.bettor.$identifier
        }
      }
    })
  ])

  //now that automatic list syncing is setup, provide the API
  ds.rpc.provide('registerUser', ({ email, charity }, response) => {
    network.registerUser({ email, charity }).then(({ email, charity, balance }) => {
      response.send({ email, charity, balance })
    }).catch(err => {
      response.error(err.message)
    })
  })

  ds.rpc.provide('makeBet', ({ email, wagerId, artist, numberOfRounds }, response) => {
    network.makeBet({ email, wagerId, artist, numberOfRounds }).then(() => {
      response.send()
    }).catch(err => {
      response.error(err.message)
    })
  })

  ds.rpc.provide('endCurrentRound', ({ artist, songData }, response) => {
    network.makeBet({ artist, songData }).then(({
      wagerId,
      artist,
      startingRoundNumber,
      endingRoundNumber,
      bettor
    }) => {
      response.send({
        wagerId,
        artist,
        startingRoundNumber,
        endingRoundNumber,
        bettor
      })
    }).catch(err => {
      response.error(err.message)
    })
  })
}

module.exports = provide
