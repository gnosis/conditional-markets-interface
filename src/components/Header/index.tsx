import Menu from "./Menu";
import * as React from 'react';;

class Header extends React.Component {
  public render() {
    return (
      <div className="app-main-header">
        <div className="d-flex app-toolbar align-items-center">
          <div className="app-logo-bl">
              <div className="app-logo pointer d-none d-md-block">
                  <img className="d-block d-lg-block" alt='...' src='./../../assets/images/logo.png'/>
              </div>
          </div>

          <div><Menu/></div>

          <ul className="header-notifications list-inline ml-auto">
              <li className="list-inline-item user-nav">
              </li>
              <li className="list-inline-item user-nav">
              </li>
              <li className="list-inline-item user-nav">
              </li>
          </ul>
        </div>
      </div>
    );
  }
}

export default Header;
