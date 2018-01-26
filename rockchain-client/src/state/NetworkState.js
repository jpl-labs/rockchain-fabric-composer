// @flow
import { types, flow } from 'mobx-state-tree'
import { filter, propEq } from 'ramda'
import { User, UserList } from './User'
import { WagerList } from './Wager'
import { GameRoundList } from './GameRound'
import { client } from './DeepstreamModels'

export type RegisterUserTx = {
  email: string,
  charity: Charity
}

export type MakeBetTx = {
  wagerId: string,
  artist: string,
  numberOfRounds: number,
  bettor: UserType
}

export type EndCurrentRoundTx = {
  artist: string,
  songData: ?string
}

export type NetworkStateType = {
  currentUser: ?UserType,
  users: UserType[],
  wagers: WagerType[],
  gameRounds: GameRoundType[],
  wagersByUser(email: string): WagerType[],
  wagersByCharity(charity: Charity): WagerType[],
  registerUser(tx: RegisterUserTx): void
}

const NetworkState = types.model('NetworkState', {
  currentUser: types.maybe(types.reference(User)),
  users: types.optional(UserList, {}),
  wagers: types.optional(WagerList, {}),
  gameRounds: types.optional(GameRoundList, {})
}).views(self => ({
  wagersByUser(email: string) {
    return filter(propEq('bettor', email), self.wagers.records)
  },

  // wagersByCharity(charity: Charity) {
  //   return filter()
  // }
})).actions(self => ({
  setCurrentUser(email) {
    self.currentUser = email
  },

  registerUser: flow(function*(tx: RegisterUserTx) {
    return yield new Promise((resolve, reject) => {
      client.rpc.make('registerUser', tx, (err, result) => {
        if (err) return reject(err)

        self.setCurrentUser(result.email)
        return resolve(result)
      })
    })
  })
}))

export default NetworkState
