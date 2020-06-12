import React, { Component } from "react";
import { Switch, Route } from "react-router-dom";

// Views
import Root from "./Root";
import Tier2 from "./views/kyc/tier2";
// import Sow from "./views/kyc/Sow";
// import NotFound from "./views/Pages/Page404/Page404";

export default class Routes extends Component {
  render() {
    return (
      <Switch>
        <Route
          render={props => (
            <Root {...props} initialModal="KYC" initialStep="SOW" />
          )}
          exact
          path="/kyc/sow"
        />
        <Route component={Tier2} exact path="/kyc/tier2" />
        <Route component={Root} exact path="/:lmsrAddress" />
        <Route component={Root} exact path="/" />
      </Switch>
    );
  }
}

// <Redirect exact from="/" to="/markets" />
// <Route component={NotFound} exact path="/not-found"/>
// <Redirect to="/not-found" />
