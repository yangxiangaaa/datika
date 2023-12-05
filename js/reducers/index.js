import { combineReducers } from "redux";

import commonSetting from './commonSetting';

export let initialState = {};

let rootReducers = combineReducers({
    commonSetting
});
export default rootReducers;