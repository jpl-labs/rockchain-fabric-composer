// @flow
import { types } from 'mobx-state-tree'
import autoId from './autoId'
import { DeepstreamRecord, DeepstreamListFactory } from './DeepstreamModels'
import { User } from './User'

export type WagerType = {
  wagerId: string,
  artist: string,
  startingRoundNumber: number,
  endingRoundNumber: number,
  bettor: UserType
}

export const Wager = types.compose(
  DeepstreamRecord,
  types.model({
    wagerId: autoId({ prefix: 'wager/' }),
    artist: types.string,
    startingRoundNumber: types.number,
    endingRoundNumber: types.number,
    bettor: types.reference(User)
  })
)
.views(self => ({
  get storageKey() { return self.wagerId }
}))
.named('Wager')

export const WagerList = DeepstreamListFactory({
  model: Wager,
  idPath: 'wagerId',
  listKey: 'wagers'
})
