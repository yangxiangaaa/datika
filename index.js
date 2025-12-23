import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import 'antd/dist/antd.css';
import 'moment/locale/zh-cn';
import './common/index.scss';
import App from './js/App';
import * as serviceWorker from './serviceWorker';
import store from './js/store';
import './js/setupMockData';
import './scss/base.scss';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Provider store={store}>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </Provider>
);

serviceWorker.register();
