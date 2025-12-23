import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';
import rootReducers, { initialState } from './reducers';

const isDev = import.meta.env?.MODE === 'development';

let enhancer = applyMiddleware(thunk);
if (isDev) {
  enhancer = compose(applyMiddleware(thunk, createLogger()));
}

const store = createStore(rootReducers, initialState, enhancer);

export default store;
