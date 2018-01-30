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
import type { LoginTx } from '../Login'

type StatelessHomePageProps = {
  currentUser: ?UserType,
  onRegisterUser(tx: RegisterUserTx): void,
  onLogin(tx: LoginTx): void
}

class StatelessHomePage extends Component<StatelessHomePageProps> {
  render() {
    const {
      currentUser,
      onRegisterUser,
      onLogin
    } = this.props

    return (
      <div>
        {!currentUser && <Registration onRegisterUser={onRegisterUser} />}
        {!currentUser && <Login onLogin={onLogin} />}
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
      onLogin={networkState.setCurrentUser}
    />
  }
}

export default HomePage
export { StatelessHomePage }
