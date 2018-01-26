// @flow
import { types } from 'mobx-state-tree'
import { values } from 'ramda'
import { Charities } from './Charity'
import { DeepstreamRecord, DeepstreamListFactory } from './DeepstreamModels'
import type { Charity } from './Charity'

export type UserType = {
  email: string,
  charity: Charity,
  balance: number
}

export const User = types.compose(
  DeepstreamRecord,
  types.model({
    email: types.identifier(types.string),
    charity: types.maybe(types.enumeration('Charity', values(Charities))),
    balance: 0.0
  })
)
.views(self => ({
  get storageKey() { return `user/${self.email}` }
}))
.named('User')

export const UserList = DeepstreamListFactory({
  model: User,
  idPath: 'email',
  idPrefix: 'user/',
  listKey: 'users'
})
