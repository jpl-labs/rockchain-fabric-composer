// @flow
import React, { Component } from 'react'
import {
  Card,
  CardTitle,
  CardText,
  CardActions,
  RaisedButton
} from 'material-ui'
import type { RegisterUserTx } from '../../state'
import RegistrationForm from './RegistrationForm'
import ConfirmationDialog from './ConfirmationDialog'

type RegistrationProps = {
  onRegisterUser(tx: ?RegisterUserTx): void
}

type RegistrationState = {
  dialogOpen: boolean,
  registerUserTx: ?RegisterUserTx
}

class Registration extends Component<RegistrationProps, RegistrationState> {
  form: ?RegistrationForm

  state = {
    dialogOpen: false,
    registerUserTx: null
  }

  openDialog = () => {
    this.setState({ ...this.state, dialogOpen: true })
  }

  closeDialog = () => {
    this.setState({ ...this.state, dialogOpen: false })
  }

  onConfirm = () => {
    const { onRegisterUser } = this.props
    this.closeDialog()
    onRegisterUser(this.state.registerUserTx)
  }

  onCancel = () => {
    this.closeDialog()
  }

  onSubmit = (values: RegisterUserTx) => {
    this.openDialog()
    this.setState({
      ...this.state,
      registerUserTx: values
    })
  }

  submitForm = () => this.form && this.form.submitForm()

  render() {
    const { dialogOpen } = this.state

    return (
      <Card>
        <CardTitle title="Register to Play" />
        <CardText>
          <RegistrationForm onSubmit={this.onSubmit} ref={form => this.form = form}/>
        </CardText>
        <CardActions>
          <RaisedButton primary={true} onClick={this.submitForm}>REGISTER</RaisedButton>
        </CardActions>
        <ConfirmationDialog open={dialogOpen} onConfirm={this.onConfirm} onCancel={this.onCancel} />
      </Card>
    )
  }
}

export default Registration
