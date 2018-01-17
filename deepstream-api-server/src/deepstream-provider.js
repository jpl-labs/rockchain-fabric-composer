const config = require('config')
const deepstream = require('deepstream.io-client-js')
const { compose, map, prop, concat } = require('ramda')

const {
  host,
  credentials
} = config.get('deepstream')

const ds = deepstream(host).login(credentials)

const provide = async network => {
  await network.init()

  //when we start up, we need to sync up the deepstream participant and asset lists
  //with the corresponding rockchain/composer lists, and then start watching for changes
  const networkUsers = await network.listUsers()
  await Promise.all(map(user => {
    return new Promise(resolve => {
      const dsUser = ds.record.getRecord(`user/${user.email}`)
      dsUser.whenReady(() => {
        dsUser.set({
          email: user.email,
          charity: user.charity,
          balance: user.balance
        }, resolve)
      })
    })
  }, networkUsers))

  const dsUserList = ds.record.getList('users')
  dsUserList.whenReady(() => {
    const userIdentifiers = map(compose(
      concat('user/'),
      prop('email')
    ), networkUsers)

    dsUserList.setEntries(userIdentifiers)

    network.on('com.omni.biznet.UserRegistered', evt => {
      const dsUser = ds.record.getRecord(`user/${evt.email}`)
      dsUser.whenReady(() => {
        dsUser.set({
          email: evt.email,
          charity: evt.charity,
          balance: evt.balance
        })
        dsUserList.addEntry(`user/${evt.email}`)
      })
    })
  })

  //now that automatic list syncing is setup, provide the API
  ds.rpc.provide('registerUser', ({ email, charity }, response) => {
    network.registerUser({ email, charity }).then(() => {
      response.send()
    }).catch(err => {
      response.error(err)
    })
  })

  ds.rpc.provide('makeBet', ({ email, wagerId, artist, numberOfRounds }, response) => {
    network.makeBet({ email, wagerId, artist, numberOfRounds }).then(() => {
      response.send()
    }).catch(err => {
      response.error(err)
    })
  })

  ds.rpc.provide('endCurrentRound', ({ artist, songData }, response) => {
    network.makeBet({ artist, songData }).then(() => {
      response.send()
    }).catch(err => {
      response.error(err)
    })
  })
}

module.exports = provide
