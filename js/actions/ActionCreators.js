import ActionTypes from './ActionTypes';
import AppDispatcher from './AppDispatcher';

var ActionCreators = {

  updateUserLocation() {
    AppDispatcher.dispatchViewAction({
      actionType: ActionTypes.GET_USER_LOCATION
    });
  }

};

export default ActionCreators;
