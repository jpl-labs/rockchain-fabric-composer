// @flow
import { types, flow } from 'mobx-state-tree'
import { filter, propEq, pathEq } from 'ramda'
import uuidv4 from 'uuid/v4'
import { User, UserList } from './User'
import { WagerList } from './Wager'
import { GameRoundList } from './GameRound'
import { client } from './util/DeepstreamModels'
import type { Charity } from './Charity'
import type { UserType, UserListType } from './User'
import type { WagerType, WagerListType } from './Wager'
import type { GameRoundType, GameRoundListType } from './GameRound'

export type RegisterUserTx = {
  email: string,
  charity: Charity
}

export type MakeBetTx = {
  artist: string,
  numberOfRounds: number
}

export type EndCurrentRoundTx = {
  artist: string,
  songData: ?string
}

export type NetworkStateType = {
  currentUser: ?UserType | ?string,
  users: UserListType,
  wagers: WagerListType,
  gameRounds: GameRoundListType,
  wagersByUser(email: string): WagerType[],
  wagersByCharity(charity: Charity): WagerType[],
  registerUser(tx: RegisterUserTx): void,
  setCurrentUser(user: UserType): void,
  makeBet(tx: MakeBetTx): void
}

const NetworkState = types.model('NetworkState', {
  currentUser: types.maybe(types.reference(User)),
  users: types.optional(UserList, {}),
  wagers: types.optional(WagerList, {}),
  gameRounds: types.optional(GameRoundList, {})
}).views((self: NetworkStateType) => ({
  wagersByUser(email: string) {
    return filter(pathEq(['bettor', 'email'], email), self.wagers.values).reverse()
  },

  wagersByCharity(charity: Charity) {
    return filter(propEq('charity', charity), self.wagers.values)
  }
})).actions((self: NetworkStateType) => ({
  setCurrentUser({ email }: UserType) {
    self.currentUser = email
  },

  registerUser: flow(function*(tx: RegisterUserTx) {
    return yield new Promise((resolve, reject) => {
      client.rpc.make('registerUser', tx, (err, result) => {
        if (err) return reject(err)

        self.setCurrentUser(result)
        resolve(result)
      })
    })
  }),

  makeBet: flow(function*(tx: MakeBetTx) {
    return yield new Promise((resolve, reject) => {
      if (!self.currentUser) return reject('Must be logged in to make bets')

      client.rpc.make('makeBet', {
        wagerId: uuidv4(),
        artist: tx.artist,
        numberOfRounds: tx.numberOfRounds,
        email: self.currentUser.email
      }, (err, result) => {
        if (err) return reject(err)
        resolve(result)
      })
    })
  })
}))

export default NetworkState
