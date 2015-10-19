/* globals chrome */
import api from './lib/api';
import config from '../config.json';

// TODO - Add auth flow w/ API key
api.setAccessToken(config.access_token);


chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse) {
    var method = (message.method || 'GET').toLowerCase();
    var request;

    switch (message.resource) {
      case 'user':
        request = api[method]('user/' + message.userId, message.data);
        break;
      case 'team':
        request = api[method]('team/' + message.teamId, message.data);
        break;
    }

    request
      .then( (res) => sendResponse(res) )
      .catch( (err) => sendResponse({ error: err }) );

    // We must return true since this is async
    return true;
  });
