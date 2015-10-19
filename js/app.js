import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment-timezone';
import ActionTypes from './actions/ActionTypes';
import AppDispatcher from './actions/AppDispatcher';
import location from './lib/location';
import tzio from './lib/tzio';
import transform from './lib/transform';
import App from './components/App';


var appData = {};

var AppFactory = React.createFactory(App);
var targetNode = document.querySelector('#app');

var render = function() {
  ReactDOM.render(
    AppFactory(appData),
    targetNode
  );
};


var pref = 12;
var fmt = pref === 24 ? 'H:mm' : 'h:mm a';

appData.time = Date.now();
appData.fmt = fmt;

appData.timezones = [];


Promise.all([
  tzio.getUser('5513998f6d1aacc66f7e7eff'),
  tzio.getTeam('5513953c6d1aacc66f7e7efe'),
]).then(function(values) {
  var user = values[0];
  var team = values[1];

  // Remove the user from displaying in their own team
  team.people = team.people.filter(function(person) {
    return person._id !== user._id;
  });

  appData.user = user;
  appData.timezones = transform.teamToTimezones(team);

  render();
});



function updateUserLocation() {

  var originalLocation = appData.user.location;
  appData.user.location = 'Checking...';
  appData.isCheckingLocation = true;
  render();

  location
    .getCurrentPosition()
    .then(function(data) {

      var newCoords = {
        lat: data.latitude,
        long: data.longitude
      };
      var lastCoords = appData.user && appData.user.coords || {};

      // If no current coords, dist is NaN
      var dist = location.calculateDistance(
        lastCoords.lat, lastCoords.long,
        newCoords.latitude, newCoords.longitude
      );

      // Check if the user has moved at least 10km
      if (!dist || dist > 10) {
        return Promise.all([
          true,
          newCoords,
          location.getCityFromCoords(newCoords),
          location.getTimezoneFromCoords(newCoords)
        ]);
      }

      return [false, lastCoords, appData.user.location, appData.user.tz];
    })
    .then(function(values) {
      var [didLocationChange, coords, location, tz] = values;

      appData.isCheckingLocation = false;
      appData.isCurrentLocation = true;

      appData.user.location = location;
      appData.user.tz = location;
      appData.user.coords = coords;

      render();

      // TODO - Save via API
      // TODO - Cache user Object

      console.log(didLocationChange, coords, location, tz);
    });
}

// Handle dispatched events
AppDispatcher.register(function(payload) {
  var action = payload.action;
  var actionType = action.actionType;

  switch (actionType) {
    case ActionTypes.GET_USER_LOCATION:
      updateUserLocation();
      break;
  }

});
