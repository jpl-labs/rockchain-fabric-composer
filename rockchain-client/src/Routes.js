// @flow
import React from 'react'
import { Switch, Route } from 'react-router-dom'
import {
  AboutPage,
  BetsPage,
  HomePage,
  LoginPage,
  PlayingPage,
  StandingsPage
} from './components'

const Routes = () => (
  <Switch>
    <Route path="/" exact={true} component={HomePage} />
    <Route path="/bets" component={BetsPage} />
    <Route path="/playing" component={PlayingPage} />
    <Route path="/standings" component={StandingsPage} />
    <Route path="/about" component={AboutPage} />
    <Route path="/login" component={LoginPage} />
    {/* catch-all redirect to homepage for all other routes */}
    <Route component={HomePage} />
  </Switch>
)

export default Routes
