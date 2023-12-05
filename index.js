import "@babel/polyfill";
import React from 'react';
import ReactDOM from 'react-dom';
import '../common/index.scss';
import App from './js/App'
import * as serviceWorker from '../serviceWorker';
import {Provider} from 'react-redux';
import store from './js/store';

import { ConfigProvider } from 'antd';
// 由于 antd 组件的默认文案是英文，所以需要修改为中文
import zhCN from 'antd/lib/locale-provider/zh_CN';
import 'moment/locale/zh-cn';

import './scss/base.scss';


ReactDOM.render(
    <Provider store={store}>
        <ConfigProvider locale={zhCN}>
            <App />
        </ConfigProvider>
    </Provider>
, document.getElementById('root'));

serviceWorker.register();