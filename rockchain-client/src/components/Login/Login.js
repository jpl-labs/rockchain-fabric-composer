// @flow
import React, { Component } from 'react'
import {
  Card,
  CardTitle,
  CardText,
  CardActions,
  RaisedButton
} from 'material-ui'
import LoginForm from './LoginForm'
import type { LoginTx } from './LoginForm'

export type { LoginTx }

type LoginProps = {
  disabled: boolean,
  onLogin(tx: LoginTx): void
}

class Login extends Component<LoginProps> {
  form: ?LoginForm

  submitForm = () => this.form && this.form.submitForm()

  render() {
    const { disabled, onLogin } = this.props

    return (
      <Card>
        <CardTitle title="Login" />
        <CardText>
          {/* TODO: auth0 integration / actual login */}
          <LoginForm onSubmit={onLogin} ref={form => this.form = form}/>
        </CardText>
        <CardActions>
          {/* TODO: hook up disabled to isSubmitting form prop */}
          <RaisedButton primary={true} onClick={this.submitForm} disabled={disabled}>LOGIN</RaisedButton>
        </CardActions>
      </Card>
    )
  }
}

export default Login
