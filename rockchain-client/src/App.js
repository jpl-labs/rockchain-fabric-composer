// @flow
import React, { Component } from 'react'
import { types } from 'mobx-state-tree'
import { Provider as MobxProvider } from 'mobx-react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import {
  SideNav,
  NavBar,
  Footer
} from './components'
import Routes from './Routes'
import { UIState, NetworkState, LocallyStored } from './state'
import './App.css'

// compose state stores with local storage capabilities
// (this will enable auto-saving all state changes to local storage,
//   and auto-loading last known state when the page is reloaded)
const LocalUIState = types.compose(
  LocallyStored,
  UIState
).views(self => ({
  get storageKey() { return 'Rockchain-uiState' }
}))

const LocalNetworkState = types.compose(
  LocallyStored,
  NetworkState
).views(self => ({
  get storageKey() { return 'Rockchain-networkState' }
}))

// instanstiate state stores ----------------------
const uiState = LocalUIState.create({ autoSave: true })
const networkState = LocalNetworkState.create({ autoSave: true })

class App extends Component<{}> {
  render() {
    return (
      <MobxProvider uiState={uiState} networkState={networkState}>
        <MuiThemeProvider>
          <div>
            <SideNav />
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
