import qs from 'querystring'
import { BASE_URL } from './constants'

var accessToken = null;


// Helper methods
var status = function(res) {
  if (res.status >= 200 && res.status < 300) {
    return Promise.resolve(res);
  } else {
    return new Promise(function(resolve, reject) {
      res.json().then(reject, reject);
    });
  }
};

var json = function(res) {
  return res.json();
};

var getData = function(data) {
  const payload = Object.assign({}, data)
  if (accessToken) {
    payload.access_token = accessToken
  }
  return payload
};

var appendQueryString = function(url, data) {
  return url + '?' + qs.stringify(data);
};

var getOptions = function(method, data) {

  if (method === 'GET')
    return { credentials: 'include' };

  return {
    method: method || 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: method !== 'GET' && JSON.stringify(getData(data))
  };
};



var api = {

  setAccessToken: (token) => accessToken = token,

  get: function(url, data) {
    return fetch(BASE_URL + appendQueryString(url, getData(data)), getOptions('GET'))
      .then(status)
      .then(json);
  },

  post: function(url, data) {
    return fetch(BASE_URL + url, getOptions('POST', data))
      .then(status)
      .then(json);
  },

  put: function(url, data) {
    return fetch(BASE_URL + url, getOptions('PUT', data))
      .then(status)
      .then(json);
  },

  delete: function(url, data) {
    return fetch(BASE_URL + url, getOptions('DELETE', data))
      .then(status)
      .then(json);
  }

};

export default api;
