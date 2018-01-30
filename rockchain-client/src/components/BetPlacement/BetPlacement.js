// @flow
import React, { Component } from 'react'
import {
  Card,
  CardTitle,
  CardText,
  CardActions,
  RaisedButton
} from 'material-ui'
import BetPlacementForm from './BetPlacementForm'
import type { MakeBetTx } from '../../state'

type BetPlacementProps = {
  onMakeBet(tx: MakeBetTx): void
}

class BetPlacement extends Component<BetPlacementProps> {
  form: ?BetPlacementForm

  submitForm = () => this.form && this.form.submitForm()

  render() {
    const { onMakeBet } = this.props

    return (
      <Card>
        <CardTitle title="Place Bet" />
        <CardText>
          <BetPlacementForm onSubmit={onMakeBet} ref={form => this.form = form}/>
        </CardText>
        <CardActions>
          <RaisedButton primary={true} onClick={this.submitForm}>PLACE BET</RaisedButton>
        </CardActions>
      </Card>
    )
  }
}

export default BetPlacement
