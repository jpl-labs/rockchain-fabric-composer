// @flow
import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import { BetPlacement } from '../BetPlacement'
import { BetList } from '../BetList'
import { CurrentRound } from '../CurrentRound'
import type { UserType, NetworkStateType, MakeBetTx } from '../../state'

type StatelessBetsPageProps = {
  currentUser: ?UserType,
  onMakeBet(tx: MakeBetTx): void
}

class StatelessBetsPage extends Component<StatelessBetsPageProps> {
  render() {
    const { currentUser, onMakeBet } = this.props

    return (
      <div>
        {!!currentUser && <BetPlacement onMakeBet={onMakeBet} />}
        <BetList />
        <CurrentRound />
      </div>
    )
  }
}

type BetsPageProps = {
  networkState: NetworkStateType
}

// $FlowFixMe
@inject('networkState')
@observer
class BetsPage extends Component<BetsPageProps> {
  render() {
    const { networkState } = this.props

    return <StatelessBetsPage
      currentUser={networkState.currentUser}
      onMakeBet={networkState.makeBet}
    />
  }
}

export default BetsPage
