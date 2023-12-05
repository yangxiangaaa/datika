import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import React, { Component, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import RootContainer from './containers/index';
import CardPreviw from './containers/CardPreview';
import { getQueryVariable } from "../../common/js/fetch";

function Routes (props) {

    return (
        <Router>
            <Switch>
                <Route exact path={"/"} component={RootContainer}></Route>
                <Route exact path={"/preview"} component={CardPreviw}></Route>
                <Redirect path={"/*"} to={"/"}></Redirect>
            </Switch>
        </Router>
    )
}

export default Routes