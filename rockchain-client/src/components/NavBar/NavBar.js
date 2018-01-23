// @flow
import React, { Component } from 'react'
import { observer, inject } from 'mobx-react'
import {
  Toolbar,
  ToolbarGroup,
  FlatButton,
  FontIcon
} from 'material-ui'
import type { UIStateType } from '../../state/UIState'

const MenuIcon = <FontIcon className="material-icons">menu</FontIcon>

type NavBarProps = {
  uiState: UIStateType
}

// $FlowFixMe
@inject('uiState')
@observer
class NavBar extends Component<NavBarProps> {

  onToggleMenu = () => {
    const { uiState: { sidenav } } = this.props
    sidenav.toggleOpen()
  }

  render() {
    return (
      <Toolbar>
        <ToolbarGroup>
          <FlatButton icon={MenuIcon} onClick={this.onToggleMenu} />
        </ToolbarGroup>
      </Toolbar>
    )
  }
}

export default NavBar
