/* global chrome */
import cache from './cache';

// tzio is the wrapper for communicating from the app script with the background
// script that also provides caching

var tzio = {};

tzio.getResource = function(message) {
  return new Promise(function(resolve, reject) {
    chrome.runtime.sendMessage(message, function(response) {
      if (response.error)
        return reject(response.error);
      resolve(response);
    });
  });
};

tzio.putResource = function(message) {
  message.method = 'PUT';
  return this.getResource(message);
};

tzio.getUser = function(force) {
  var cacheKey = 'user';
  return cache
    .get(cacheKey)
    .then(function(user) {
      // Should/can we use the cached user?
      if (user && !force && (user.fetchedAt - new Date() <= 60 * 1000))
        return user

      return this.getResource({
        resource: 'self'
      });
    }.bind(this))
    .then(function(user) {
      user.fetchedAt = new Date()
      cache.set(cacheKey, user)
      return user
    });
};

tzio.saveUser = function(userId, data) {
  var cacheKey = 'user';
  return this
    .putResource({
      resource: 'user',
      userId: userId,
      data: data
    })
    .then(function(user) {
      cache.set(cacheKey, user);
      return user;
    });
};

tzio.getTeam = function(teamId) {
  var cacheKey = 'team:' + teamId;
  return cache
    .get(cacheKey)
    .then(function(team) {
      if (team)
        return team;

      return this.getResource({
        resource: 'team',
        teamId: teamId
      });
    }.bind(this))
    .then(function(team) {
      cache.set(cacheKey, team);
      return team;
    });
};

export default tzio;
