// @flow
import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import { Switch, Route, Redirect, withRouter } from 'react-router-dom'
import {
  AboutPage,
  BetsPage,
  HomePage,
  LoginPage,
  PlayingPage,
  StandingsPage
} from './components'
import type { NetworkStateType } from './state'

const ProtectedRoute = ({ component: Component, currentUser, ...rest }) => (
  <Route {...rest} render={props => (
    currentUser
    ? <Component {...props} />
    : <Redirect to={{
        pathname: '/',
        state: { from: props.location }
      }} />
  )}/>
)

const LoginRouteHandler = ({ currentUser, location, ...rest }) => (
  currentUser
  ? <Redirect to={location.state.from || '/'} />
  : <LoginPage {...rest} />
)

const StatelessRoutes = ({ currentUser }) => (
  <Switch>
    <Route path="/" exact={true} component={HomePage} />
    <ProtectedRoute path="/bets" component={BetsPage} currentUser={currentUser} />
    <ProtectedRoute path="/playing" component={PlayingPage} currentUser={currentUser} />
    <ProtectedRoute path="/standings" component={StandingsPage} currentUser={currentUser} />
    <Route path="/about" component={AboutPage} />
    <Route path="/login" component={LoginRouteHandler} />
    {/* catch-all redirect to homepage for all other routes */}
    <Route component={HomePage} />
  </Switch>
)

type RoutesProps = {
  networkState: NetworkStateType
}

// $FlowFixMe
@withRouter
@observer
class Routes extends Component<RoutesProps> {
  render() {
    const { networkState: { currentUser }} = this.props
    return <StatelessRoutes currentUser={currentUser} />
  }
}

export default Routes
