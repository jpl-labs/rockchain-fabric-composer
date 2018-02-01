// @flow
import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import {
  Card,
  CardTitle,
  CardText,
  GridList,
  GridTile,
  Tabs,
  Tab,
  RefreshIndicator
} from 'material-ui'
import { BetList } from '../BetList'
import { WinnerList } from '../WinnerList'
import type { NetworkStateType } from '../../state'
import './CurrentRound.css'

type StatelessCurrentRoundProps = {
  roundPot?: ?number
}

class StatelessCurrentRound extends Component<StatelessCurrentRoundProps> {
  render() {
    const { roundPot } = this.props
    const hasRoundPot = typeof roundPot !== 'undefined'

    return (
      <Card className="current-round">
        <CardTitle title="Current Round" />
        <CardText>
          <GridList cols={2} cellHeight={50}>
            <GridTile cols={1} rows={1} className="round-pot">
              {hasRoundPot
                ? <div>Pot: {roundPot}</div>
                : <div className="loading container">
                    Pot: <RefreshIndicator
                            className="loading indicator"
                            status="loading"
                            top={2}
                            left={5}
                            size={20}
                          />
                  </div>
              }
            </GridTile>
          </GridList>

          <Tabs>
            <Tab label="Recent Bets">
              <CardText>
                <BetList limit={10} showUser={true} />
              </CardText>
            </Tab>
            <Tab label="Recent Winners">
              <CardText>
                <WinnerList limit={10} showUser={true} />
              </CardText>
            </Tab>
          </Tabs>
        </CardText>
      </Card>
    )
  }
}

type CurrentRoundProps = {
  networkState: NetworkStateType
}

// $FlowFixMe
@inject('networkState')
@observer
class CurrentRound extends Component<CurrentRoundProps> {
  render() {

    return <StatelessCurrentRound />
  }
}

export default CurrentRound
