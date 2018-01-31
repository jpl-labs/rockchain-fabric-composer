// @flow
import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import { Card, CardTitle, CardText, CardHeader } from 'material-ui'
import { map } from 'ramda'
import type { UserType, WagerType, NetworkStateType } from '../../state'

type WagerCardProps = {
  wager: WagerType
}

class WagerCard extends Component<WagerCardProps> {
  render() {
    const { wager } = this.props

    return (
      <Card>
        <CardHeader>
          TODO: add icon<br/>
          <CardTitle
            title={wager.artist}
            subtitle={`Rounds ${wager.startingRoundNumber} - ${wager.endingRoundNumber}`}
          />
        </CardHeader>
      </Card>
    )
  }
}

type StatelessBetListProps = {
  user: UserType,
  wagers: WagerType[]
}

class StatelessBetList extends Component<StatelessBetListProps> {
  render() {
    const { user, wagers } = this.props

    return (
      <Card>
        <CardTitle title={`Active bets for ${user.email}`} />
        <CardText>
          {map(wager => <WagerCard wager={wager} key={wager.wagerId} />, wagers)}
        </CardText>
      </Card>
    )
  }
}

type BetListProps = {
  user: UserType,
  networkState: NetworkStateType
}

// $FlowFixMe
@inject('networkState')
@observer
class BetList extends Component<BetListProps> {

  get wagers(): WagerType[] {
    const { user, networkState } = this.props
    return networkState.wagersByUser(user.email)
  }

  render() {
    const { user } = this.props

    return <StatelessBetList user={user} wagers={this.wagers} />
  }
}

export default BetList
