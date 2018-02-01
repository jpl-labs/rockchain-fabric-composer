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
import type { UserType, WinningWagerType, NetworkStateType } from '../../state'
import './WinnerList.css'

type WinnerCardProps = {
  wager: WinningWagerType,
  showUser: ?boolean
}

class WinnerCard extends Component<WinnerCardProps> {
  render() {
    const { wager, showUser } = this.props

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <FontIcon className="material-icons bet-icon">grade</FontIcon>
            {!!showUser && <strong>{wager.bettor.email}</strong>}
            - Payout: Ꮻ {wager.gameRound.results.payout}
          </CardTitle>
          <CardTitle
            title={wager.artist}
            subtitle={`Round ${wager.gameRound.roundNumber}`}
          />
        </CardHeader>
      </Card>
    )
  }
}

type StatelessWinnerListProps = {
  user: ?UserType,
  wagers: WinningWagerType[],
  showUser: ?boolean
}

class StatelessWinnerList extends Component<StatelessWinnerListProps> {
  render() {
    const { user, wagers, showUser } = this.props

    return (
      <Card>
        {!!user && <CardTitle title={`Winning bets for ${user.email}`} />}
        <CardText>
          {map(wager => <WinnerCard wager={wager} key={wager.wagerId} showUser={showUser} />, wagers)}
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
class WinnerList extends Component<BetListProps> {

  get wagers(): WinningWagerType[] {
    const { user, networkState, limit } = this.props
    // reverse so most recent bets render at the top
    const wagers = reverse(user ? networkState.winningWagersByUser(user.email) : networkState.winningWagers)
    if (limit) {
      return wagers.slice(0, limit)
    }
    return wagers
  }

  render() {
    const { user, showUser } = this.props

    return this.wagers.length
      ? <StatelessWinnerList user={user} wagers={this.wagers} showUser={showUser} />
      : <div>There have not been any winners yet!</div>
  }
}

export default WinnerList
export { StatelessWinnerList }
