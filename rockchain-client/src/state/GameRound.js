// @flow
import { types } from 'mobx-state-tree'
import { autoId } from './util'
import { DeepstreamRecord, DeepstreamListFactory } from './util/DeepstreamModels'
import type { DeepstreamList } from './util/DeepstreamModels'
import { User } from './User'
import { Wager } from './Wager'
import type { WagerType } from './Wager'

export type RoundResultsType = {
  winners: WagerType[],
  artist: string,
  songData: ?string,
  payout: ?number
}

export type GameRoundType = {|
  roundId: string,
  roundNumber: number,
  startingPot: number,
  isCurrent: boolean,
  results: ?RoundResultsType
|}

export type GameRoundListType = DeepstreamList<GameRoundType>

export const RoundResults = types.model('RoundResults', {
  winners: types.optional(types.array(types.reference(Wager)), []),
  artist: types.string,
  songData: types.maybe(types.string),
  payout: types.maybe(types.number)
})

export const GameRound = types.compose(
  DeepstreamRecord,
  types.model({
    roundId: autoId({ prefix: 'gameRound/' }),
    roundNumber: 1,
    startingPot: 0,
    isCurrent: true,
    results: types.maybe(RoundResults)
  })
).views(self => ({
  get storageKey() { return `gameRound/${self.roundId}` }
})).named('GameRound')

export const GameRoundList = DeepstreamListFactory({
  model: GameRound,
  idPath: 'roundId',
  idPrefix: 'gameRound/',
  listKey: 'gameRounds'
})
