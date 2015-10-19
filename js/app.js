import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment-timezone';
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

var now = new Date();
var pref = 12;
var fmt = pref === 24 ? 'H:mm' : 'h:mm a';

appData.time = Date.now();
appData.fmt = fmt;

appData.user = {
  name: 'Dan',
  location: 'New York',
  tz: 'America/New_York',
  avatar: 'http://www.gravatar.com/avatar/3d7fe8ff82fa8aa25972045b57b42d98?s=100'
};

appData.timezones = [];


Promise.all([
  // tzio.getUser(),
  tzio.getTeam('5513953c6d1aacc66f7e7efe'),
]).then(function(values) {
  var team = values[0];

  appData.timezones = transform.teamToTimezones(team);

  render();
});
