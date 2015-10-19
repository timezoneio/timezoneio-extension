import { Dispatcher } from 'flux';

var AppDispatcher = new Dispatcher();

AppDispatcher.dispatchViewAction = function(action) {
  this.dispatch({
    source: 'VIEW_ACTION',
    action: action
  });
};

AppDispatcher.dispatchApiAction = function(action) {
  this.dispatch({
    source: 'API_ACTION',
    action: action
  });
};

export default AppDispatcher;
