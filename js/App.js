import React, { Component, useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";


import FrameWork from '../../common/FrameWork';
import {Alert,Loading} from "../../common";
import Routes from "./Routes";
import commonSettingActions from "./actions/commonSettingActions";
import { getQueryVariable } from "../../common/js/fetch";


//使用mock
// import './mock'

// import '../scss/base.scss'

function App (props) {

    const state = useSelector((state) => state);
    const dispatch = useDispatch();

    const { alert, appLoading, userInfo} = state.commonSetting;


    const pageInit = async () =>{
        const UserInfo = JSON.parse(sessionStorage.getItem("UserInfo"));
        dispatch(commonSettingActions.updateUserInfo(UserInfo));
        // dispatch(commonSettingActions.appLoadingHide());
    }

    return (
        <div className="App">
            <Loading spinning={appLoading} tip={"加载中,请稍候..."}  opacity={false}>
                <div style={{display:'none'}}>
                    <FrameWork
                        pageInit={pageInit}  
                    >
                    </FrameWork>
                </div>
                <Routes></Routes>
            </Loading>

            <Alert type={alert.type} okShow={alert.okShow} abstract={alert.abstract} cancelShow={alert.cancelShow} onClose={alert.close} onHide={alert.hide} show={alert.show} title={alert.title} onOk={alert.ok} onCancel={alert.cancel} okTitle={alert.okTitle} cancelTitle={alert.cancelTitle}></Alert>
        </div>
    )
}

export default App