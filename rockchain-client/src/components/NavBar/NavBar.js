// @flow
import React, { Component } from 'react'
import { observer, inject } from 'mobx-react'
import {
  Toolbar,
  ToolbarGroup,
  FlatButton,
  FontIcon
} from 'material-ui'
import type { UIStateType, NetworkStateType } from '../../state'

const MenuIcon = <FontIcon className="material-icons">menu</FontIcon>

type NavBarProps = {
  uiState: UIStateType,
  networkState: NetworkStateType
}

// $FlowFixMe
@inject('uiState', 'networkState')
@observer
class NavBar extends Component<NavBarProps> {

  onToggleMenu = () => {
    const { uiState: { sidenav } } = this.props
    sidenav.toggleOpen()
  }

  render() {
    const { networkState: { currentUser }} = this.props

    return (
      <Toolbar>
        <ToolbarGroup>
          <FlatButton icon={MenuIcon} onClick={this.onToggleMenu} />
        </ToolbarGroup>
        <ToolbarGroup>
          {!!currentUser && currentUser.email}
        </ToolbarGroup>
      </Toolbar>
    )
  }
}

export default NavBar
