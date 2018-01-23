// @flow
import React, { Component } from 'react'
import { Provider as MobxProvider } from 'mobx-react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import {
  SideNav,
  NavBar,
  Footer
} from './components'
import Routes from './Routes'
import { UIState, NetworkState } from './state'
import './App.css'

//instanstiate state stores
const uiState = UIState.create()
const networkState = NetworkState.create()

class App extends Component<{}> {
  render() {
    return (
      <MobxProvider uiState={uiState} networkState={networkState}>
        <MuiThemeProvider>
          <div>
            <SideNav foo="123"/>
            <NavBar />
            <div className="app-body">
              <Routes />
            </div>
            <Footer />
          </div>
        </MuiThemeProvider>
      </MobxProvider>
    )
  }
}

export default App
