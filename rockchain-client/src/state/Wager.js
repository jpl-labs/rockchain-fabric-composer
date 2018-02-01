// @flow
import { types } from 'mobx-state-tree'
import autoId from './util/autoId'
import { DeepstreamRecord, DeepstreamListFactory } from './util/DeepstreamModels'
import type { DeepstreamList } from './util/DeepstreamModels'
import { User } from './User'
import type { UserType } from './User'

export type WagerType = {|
  wagerId: string,
  artist: string,
  startingRoundNumber: number,
  endingRoundNumber: number,
  bettor: UserType
|}

export type WagerListType = DeepstreamList<WagerType>

export const Wager = types.compose(
  DeepstreamRecord,
  types.model({
    wagerId: autoId(),
    artist: types.maybe(types.string),
    startingRoundNumber: types.maybe(types.number),
    endingRoundNumber: types.maybe(types.number),
    bettor: types.maybe(types.reference(User))
  })
).views(self => ({
  get storageKey() { return `wager/${self.wagerId}` }
})).named('Wager')

export const WagerList = DeepstreamListFactory({
  model: Wager,
  idPath: 'wagerId',
  idPrefix: 'wager/',
  listKey: 'wagers'
})
