import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment-timezone';
import ActionTypes from './actions/ActionTypes';
import AppDispatcher from './actions/AppDispatcher';
import location from './lib/location';
import tzio from './lib/tzio';
import transform from './lib/transform';
import { MIN_DISTANCE_TO_UPDATE } from './lib/constants'
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

var teamId = '5642c51707ae23f22826b8fd';

tzio.getUser()
  .then((user) => {
    const teamId = user.teams[0]._id
    tzio.getTeam(teamId)
      .then((team) => {
        // Remove the user from displaying in their own team
        team.people = team.people.filter((person) => person._id !== user._id)

        appData.user = user
        appData.timezones = transform.teamToTimezones(team)

        render()
      })
  })


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
        newCoords.lat, newCoords.long
      );

      // Check if the user has moved min distance
      if (!dist || dist > MIN_DISTANCE_TO_UPDATE) {
        return Promise.all([
          true,
          newCoords,
          location.getCityFromCoords(newCoords),
          location.getTimezoneFromCoords(newCoords)
        ]);
      }

      return [false, lastCoords, originalLocation, appData.user.tz];
    })
    .then(function(values) {
      var [didLocationChange, coords, location, tz] = values;

      appData.isCheckingLocation = false;
      appData.isCurrentLocation = true;

      appData.user.location = location;
      appData.user.tz = tz;
      appData.user.coords = coords;

      render();

      // Save the user via the API and update any newer data from the API
      if (didLocationChange)
        tzio
          .saveUser(userId, appData.user)
          .then(function(user) {
            appData.user = user;
            render();
          });
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
