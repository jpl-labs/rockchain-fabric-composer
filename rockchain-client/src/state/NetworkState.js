// @flow
import { types } from 'mobx-state-tree'
import { values, filter, propEq } from 'ramda'

//#region flowtypes
export const Charities = {
  Undefined: 'Undefined',
  Animals: 'Animals',
  Kids: 'Kids',
  Disaster: 'Disaster'
}
// union-type based enum (https://flow.org/en/docs/types/utilities/#toc-keys)
export type Charity = $Keys<typeof Charities>
export type UserType = {
  email: string,
  charity: Charity,
  balance: number
}
export type WagerType = {
  wagerId: string,
  artist: string,
  startingRoundNumber: number,
  endingRoundNumber: number,
  bettor: UserType
}
export type RoundResultsType = {
  winners: WagerType[],
  artist: string,
  songData: ?string,
  payout: ?number
}
export type GameRoundType = {
  roundId: string,
  roundNumber: number,
  startingPot: number,
  isCurrent: boolean,
  results: ?RoundResultsType
}
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
//#endregion

const User = types.model('User', {
  email: types.identifier(types.string),
  charity: types.enumeration('Charity', values(Charities)),
  balance: 0.0
})

const Wager = types.model('Wager', {
  wagerId: types.identifier(types.string),
  artist: types.string,
  startingRoundNumber: types.number,
  endingRoundNumber: types.number,
  bettor: types.reference(User)
})

const RoundResults = types.model('RoundResults', {
  winners: types.optional(types.array(types.reference(User)), []),
  artist: types.string,
  songData: types.maybe(types.string),
  payout: types.maybe(types.number)
})

const GameRound = types.model('GameRound', {
  roundId: types.identifier(types.string),
  roundNumber: 1,
  startingPot: 0,
  isCurrent: true,
  results: types.maybe(RoundResults)
})

const NetworkState = types.model('NetworkState', {
  currentUser: types.maybe(User),
  users: types.optional(types.array(User), []),
  wagers: types.optional(types.array(Wager), []),
  gameRounds: types.optional(types.array(GameRound), [])
}).views(self => ({
  wagersByUser(email: string) {
    return filter(propEq('bettor', email), self.wagers)
  },

  // wagersByCharity(charity: Charity) {
  //   return filter()
  // }
})).actions(self => ({
  registerUser(tx: RegisterUserTx) {

  }
}))

export default NetworkState
