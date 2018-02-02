const config = require('config')
const deepstream = require('deepstream.io-client-js')
const {
  compose,
  map,
  prop,
  concat,
  omit,
  last,
  split,
  assoc
} = require('ramda')

const {
  host,
  credentials
} = config.get('deepstream')

const ds = deepstream(host).login(credentials)

/**
 * Takes list/record metadata and fetches data from the Composer
 * network on startup, syncs that data to Deepstream records/lists
 * and sets up event listeners to continuously sync data from the
 * Composer network to the Deepstream server.
 */
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
        dsRecord.set(record, resolve)
        network.logger.info('DeepstreamApi::syncList', 'Record synced: ', id)
      })
    })
  }, list))

  //get the deepstream list handle
  const dsList = ds.record.getList(listName)
  dsList.whenReady(() => {
    const identifiers = map(compose(
      concat(`${recordName}/`),
      prop(idKey)
    ), list)

    //sync initial Composer state to the list
    dsList.setEntries(identifiers)

    //listen to Composer network events to continuously update records/list
    network.on(`com.omni.biznet.${eventName}`, async evt => {
      const record = await mapEventToRecord(evt)
      const id = `${recordName}/${record[idKey]}`
      const dsRecord = ds.record.getRecord(id)
      dsRecord.whenReady(() => {
        dsRecord.set(record)
        if (dsList.getEntries().indexOf(id) === -1) {
          dsList.addEntry(id)
        }
        network.logger.info(`DeepstreamApi::on${eventName}`, `Added a ${recordName} to deepstream - id: ${id}`)
      })
    })
  })
}

const syncUsers = (network, users) => syncList({
  network,
  list: users,
  recordName: 'user',
  idKey: 'email',
  listName: 'users',
  eventName: 'UserRegistered',
  serializeRecord: async ({ email, charity, balance }) => ({ email, charity, balance }),
  mapEventToRecord: async ({ email, charity, balance }) => ({ email, charity, balance })
})

const syncWagers = (network, wagers) => syncList({
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

//some helper functions for extracting game round data from composer to ds
//(Composer peppers the data with some noisy metadata props that we don't care about)
const omitClass = omit(['$class'])
const mapWinnerIds = map(compose(
  concat('wager/'),
  last,
  split('#')
))
const mapResults = results => compose(
  assoc('winners', mapWinnerIds(results.winners || [])),
  omitClass
)(results)

const syncGameRounds = (network, gameRounds) => syncList({
  network,
  list: gameRounds,
  recordName: 'gameRound',
  idKey: 'roundId',
  listName: 'gameRounds',
  eventName: 'RoundCompleted',
  serializeRecord: async gameRound => {
    const serializedGameRound = network.serializer.toJSON(gameRound)
    const results = serializedGameRound.results

    return compose(
      assoc('results', results ? mapResults(results) : null),
      omitClass
    )(serializedGameRound)
  },
  mapEventToRecord: async ({
    round: { $identifier: roundId },
    newRound: { $identifier: newRoundId }
  }) => {
    const [completedRound, newRound] = await Promise.all([
      network.gameRoundRegistry.get(roundId),
      network.gameRoundRegistry.get(newRoundId)
    ])

    //manually update the completed round
    const dsRecord = ds.record.getRecord(`gameRound/${roundId}`)
    dsRecord.whenReady(() => {
      dsRecord.set({
        roundId: completedRound.roundId,
        roundNumber: completedRound.roundNumber,
        startingPot: completedRound.startingPot,
        isCurrent: completedRound.isCurrent,
        results: completedRound.results
      })
    })

    //return the mapping for the new round and let the list sync method handle it
    return {
      roundId: newRound.roundId,
      roundNumber: newRound.roundNumber,
      startingPot: newRound.startingPot,
      isCurrent: newRound.isCurrent
    }
  }
})

const provide = async network => {
  await network.init()

  //when we start up, we need to sync up the deepstream participant and asset lists
  //with the corresponding rockchain/composer lists, and then start watching for changes
  const [users, wagers, gameRounds] = await Promise.all([
    network.listUsers(),
    network.listWagers(),
    network.listGameRounds()
  ])

  await Promise.all([
    syncUsers(network, users),
    syncWagers(network, wagers),
    syncGameRounds(network, gameRounds)
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
