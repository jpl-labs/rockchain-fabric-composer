// @flow
import { types } from 'mobx-state-tree'

//flowtypes for component Prop validation when injected
export type SideNavStateType = {
  isOpen: boolean,
  toggleOpen(open: ?boolean): void
}
export type UIStateType = {
  sidenav: SideNavStateType
}

const SideNavState = types.model({
  isOpen: false
}).actions(self => ({
  toggleOpen(open?: boolean) {
    self.isOpen = typeof open !== 'undefined' ? !!open : !self.isOpen
  }
}))

const UIState = types.model('UIState', {
  sidenav: types.optional(SideNavState, {})
})

export default UIState
