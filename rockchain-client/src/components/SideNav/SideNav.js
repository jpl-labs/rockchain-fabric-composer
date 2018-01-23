// @flow
import React, { Component } from 'react'
import { observer, inject } from 'mobx-react'
import { NavLink } from 'react-router-dom'
import {
  Drawer,
  MenuItem,
  Divider
} from 'material-ui'
import type { UIStateType } from '../../state'
import logo from '../../assets/rockchain-header-logo-300x100-01.png'
import './SideNav.css'

const noop = () => {}
const menuItemStyle = { background: 'inherit' }

const NavMenuItem = ({ to, children, onClick = noop }) => (
  <NavLink to={to} onClick={() => onClick()} className="nav-link" activeClassName="active">
    <MenuItem className="menu-item" style={menuItemStyle}>{children}</MenuItem>
  </NavLink>
)

type StatelessSideNavProps = {
  isOpen: boolean,
  onToggleOpen: (open: ?boolean) => void
}

class StatelessSideNav extends Component<StatelessSideNavProps> {

  render() {
    const { isOpen, onToggleOpen } = this.props

    return (
      <Drawer
        className="side-nav"
        open={isOpen}
        width={440}
        docked={false}
        onRequestChange={onToggleOpen}
      >
        <img src={logo} alt="Rockchain logo" className="logo" />
        <Divider />
        <NavMenuItem to="/bets" onClick={onToggleOpen}>Make Bets</NavMenuItem>
        <NavMenuItem to="/playing" onClick={onToggleOpen}>Now Playing</NavMenuItem>
        <NavMenuItem to="/wallet" onClick={onToggleOpen}>My Wallet</NavMenuItem>
        <NavMenuItem to="/standings" onClick={onToggleOpen}>Standings</NavMenuItem>
      </Drawer>
    )
  }
}

type SideNavProps = {
  uiState: UIStateType
}

// $FlowFixMe
@inject('uiState')
@observer
class SideNav extends Component<SideNavProps> {

  onToggleOpen = (open: ?boolean) => {
    const { uiState: { sidenav } } = this.props
    sidenav.toggleOpen(open)
  }

  render() {
    const { uiState: { sidenav } } = this.props
    return <StatelessSideNav isOpen={sidenav.isOpen} onToggleOpen={this.onToggleOpen} />
  }
}

export default SideNav
