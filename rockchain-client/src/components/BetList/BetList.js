// @flow
import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import {
  Card,
  CardTitle,
  CardText,
  CardHeader,
  FontIcon
} from 'material-ui'
import { map, reverse } from 'ramda'
import type { UserType, WagerType, NetworkStateType } from '../../state'
import './BetList.css'

type WagerCardProps = {
  wager: WagerType,
  showUser: ?boolean
}

// $FlowFixMe
@observer
class WagerCard extends Component<WagerCardProps> {
  render() {
    const { wager, showUser } = this.props

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <FontIcon className="material-icons bet-icon">queue_music</FontIcon>
            {!!showUser && wager.bettor && <strong>{wager.bettor.email}</strong>}
          </CardTitle>
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
  user: ?UserType,
  wagers: WagerType[],
  showUser: ?boolean
}

class StatelessBetList extends Component<StatelessBetListProps> {
  render() {
    const { user, wagers, showUser } = this.props

    return (
      <Card>
        {!!user && <CardTitle title={`Active bets for ${user.email}`} />}
        <CardText>
          {map(wager => <WagerCard wager={wager} key={wager.wagerId} showUser={showUser} />, wagers)}
        </CardText>
      </Card>
    )
  }
}

type BetListProps = {
  user: ?UserType,
  networkState: NetworkStateType,
  limit: ?number,
  showUser: ?boolean
}

// $FlowFixMe
@inject('networkState')
@observer
class BetList extends Component<BetListProps> {

  get wagers(): WagerType[] {
    const { user, networkState, limit } = this.props
    // reverse so most recent bets render at the top
    const wagers = reverse(user ? networkState.wagersByUser(user.email) : networkState.wagers.values)
    if (limit) {
      return wagers.slice(0, limit)
    }
    return wagers
  }

  render() {
    const { user, showUser } = this.props

    return this.wagers.length
      ? <StatelessBetList user={user} wagers={this.wagers} showUser={showUser} />
      : <div>No wagers have been made yet!</div>
  }
}

export default BetList
export { StatelessBetList }
