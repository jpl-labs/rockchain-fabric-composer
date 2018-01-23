// @flow
import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import type {
  UserType,
  RegisterUserTx,
  NetworkStateType
} from '../../state'
import {
  Registration,
  Login,
  Wallet,
  Faq,
  BetList
} from '../'

type StatelessHomePageProps = {
  currentUser: ?UserType,
  onRegisterUser(tx: RegisterUserTx): void
}

class StatelessHomePage extends Component<StatelessHomePageProps> {
  render() {
    const {
      currentUser,
      onRegisterUser
    } = this.props

    return (
      <div>
        {!currentUser && <Registration onRegisterUser={onRegisterUser} />}
        {!currentUser && <Login />}
        {!!currentUser && <Wallet />}
        {!currentUser && <Faq />}
        <BetList />
      </div>
    )
  }
}

type HomePageProps = {
  networkState: NetworkStateType
}

// $FlowFixMe
@inject('networkState')
@observer
class HomePage extends Component<HomePageProps> {
  render() {
    const { networkState } = this.props

    return <StatelessHomePage
      currentUser={networkState.currentUser}
      onRegisterUser={networkState.registerUser}
    />
  }
}

export default HomePage
export { StatelessHomePage }
