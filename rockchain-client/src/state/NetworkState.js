// @flow
import { types, flow } from 'mobx-state-tree'
import {
  __,
  compose,
  map,
  path,
  concat,
  gt,
  flatten,
  filter,
  propEq,
  pathEq,
  find,
  sortBy,
  prop,
  assoc
} from 'ramda'
import uuidv4 from 'uuid/v4'
import { User, UserList } from './User'
import { WagerList } from './Wager'
import { GameRoundList } from './GameRound'
import { client } from './util/DeepstreamModels'
import type { Charity } from './Charity'
import type { UserType, UserListType } from './User'
import type { WagerType, WagerListType } from './Wager'
import type { GameRoundType, GameRoundListType, RoundResultsType } from './GameRound'

/**
 * n.b.: Mixin helper type for winning wagers.
 * adds the relationship to the gameRound that the wager
 * was a winner for, and enforces non-null `results` property
 * on the gameRound (normally can be null if the round is current)
 *
 * note the {| ... |} bracketing. This is an "exact type" in flow
 * https://flow.org/en/docs/types/objects/#toc-exact-object-types
 * and is required when using the spread (...) operator to mix types
 */
export type WinningWagerType = {|
  ...WagerType,
  gameRound: {|
    ...GameRoundType,
    results: RoundResultsType
  |}
|}

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
  currentUser: ?UserType,
  users: UserListType,
  wagers: WagerListType,
  gameRounds: GameRoundListType,
  wagersByUser(email: string): WagerType[],
  wagersByCharity(charity: Charity): WagerType[],
  sortedGameRounds(): GameRoundType[],
  roundsWithWinners(): GameRoundType[],
  winningRoundForWager(wager: WagerType): GameRoundType,
  winningWagers(): WinningWagerType[],
  winningWagersByUser(email: string): WinningWagerType[],
  registerUser(tx: RegisterUserTx): void,
  setCurrentUser(user: UserType): void,
  makeBet(tx: MakeBetTx): void
}

const NetworkState = types.model('NetworkState', {
  currentUser: types.maybe(types.reference(User)),
  users: types.optional(UserList, {}),
  wagers: types.optional(WagerList, {}),
  gameRounds: types.optional(GameRoundList, {})
}).views(self => ({
  wagersByUser(email: string, wagers: ?WagerType[]) {
    return filter(pathEq(['bettor', 'email'], email), wagers || self.wagers.values)
  },

  wagersByCharity(charity: Charity) {
    return filter(propEq('charity', charity), self.wagers.values)
  },

  get sortedGameRounds() {
    return sortBy(prop('roundNumber'), self.gameRounds.values)
  },

  get roundsWithWinners() {
    return filter(compose(
      gt(__, 0),
      path(['results', 'winners', 'length'])
    ))(self.sortedGameRounds)
  },

  winningRoundForWager(wager: WagerType) {
    const { startingRoundNumber, endingRoundNumber, artist } = wager

    return find(round => {
      return round.roundNumber >= startingRoundNumber
        && round.roundNumber <= endingRoundNumber
        && round.artist === artist
    })(self.sortedGameRounds)
  },

  get winningWagers() {
    //first pluck out the arrays of winning wagers
    const winnerArrays = map(compose(
      concat([]),
      path(['results', 'winners'])
    ))(self.roundsWithWinners)

    //flatten our array of arrays into just an array of winners
    const winners = flatten(winnerArrays)

    //associate the winning gameRound with each wager and return final array
    return map(winner => assoc('gameRound', self.winningRoundForWager(winner)), winners)
  },

  winningWagersByUser(email: string) {
    return self.wagersByUser(email, self.winningWagers)
  }
})).actions(self => ({
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
