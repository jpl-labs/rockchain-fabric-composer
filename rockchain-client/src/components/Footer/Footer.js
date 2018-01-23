// @flow
import React, { Component } from 'react'

class Footer extends Component<{}> {
  render() {
    return (
      <footer className="docs-footer">
        <div className="docs-footer-list">
          <div className="footer-logo">
          </div>

          <div className="docs-footer-links">
            <ul>
              <li> <a href="http://omniresources.com/careers" target="_blank" rel="noopener noreferrer">Omni Resources - We're Hiring!</a></li>
            </ul>
          </div>

          <div className="docs-footer-copyright">
            <p>Powered by Omni ©2017. Code licensed under an MIT-style License.</p>
          </div>
        </div>
      </footer>
    )
  }
}

export default Footer
