/* globals chrome */
import api from './lib/api'
import { MIN_DISTANCE_TO_UPDATE, LOGIN_URL } from './lib/constants'
import location from './lib/location'
import config from '../config.json'

let user = null
let preferences = {}
let initializationAttempts = 0
const lastPosition = {
  coords: {
    lat: null,
    long: null,
  },
  location: null,
  tz: null,
}
let locationLastUpdated = null;


const getUserAccessToken = () => {
  // TODO - Add auth flow w/ API key
  return api.get(`client/${config.clientId}/token`, { secret: config.clientSecret })
    .then(res => api.setAccessToken(res.token))
    .catch(err => console.error('Error getting access token: ', err))
}

const getUserData = () => api.get('self').then(res => user = res)

const getCurrentPosition = (user) => {
  return location.getCurrentPosition().then(position => {
    lastPosition.coords.lat = position.latitude;
    lastPosition.coords.long = position.longitude;
    locationLastUpdated = new Date();
    return { user, coords: lastPosition.coords }
  })
}

const shouldUpdateLocation = (coords1, coords2) => {
  const distance = location.calculateDistance(coords1.lat, coords1.long, coords2.lat, coords2.long)
  return distance >= MIN_DISTANCE_TO_UPDATE
}

const saveNewUserLocation = () => {
  console.log('Saving new location!', lastPosition)
  api.put(`user/${user._id}`, lastPosition)
    .then(res => {
      console.log('New user location saved!', res)
    })
    .catch(err => {
      console.error('Failed to save new user location')
    })
}

const BUTTON_CALLBACKS = {};
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId in BUTTON_CALLBACKS) {
    chrome.notifications.clear(notificationId)
    BUTTON_CALLBACKS[notificationId](buttonIndex)
    delete BUTTON_CALLBACKS[notificationId]
  }
})

const openLoginTab = (loginUrl) => {
  let loginTabId = null

  const onTabClose = (tabId, removeInfo) => {
    if (tabId === loginTabId) {
      loginTabId = null
      chrome.tabs.onRemoved.removeListener(onTabClose)
      initializeApp()
    }
  }

  chrome.tabs.create({ url: loginUrl }, (tab) => {
    loginTabId = tab.id
    chrome.tabs.onRemoved.addListener(onTabClose)
  })
}

const displayLoginNotification = (loginUrl) => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icons/256.png',
    title: `Login to Timezone.io!`,
    message: `For this extension to work, you'll need to login`,
    buttons: [
      {
        title: 'Login now',
      }
    ]
  }, (notificationId) => {
    BUTTON_CALLBACKS[notificationId] = (buttonIdx) => openLoginTab(loginUrl)
  })
}

const displaySaveLocationNotification = (user, city) => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icons/256.png',
    title: `Welcome to ${city}!`,
    message: `It seems you're working from a new location, would you like to share this change with your team?`,
    buttons: [
      {
        title: 'Share my new location on Timezone.io!',
      }
    ]
  }, (notificationId) => {
    BUTTON_CALLBACKS[notificationId] = (buttonIdx) => saveNewUserLocation()
  })
}

const checkUserLocationForUpdate = () => {
  getUserData()
    .then(getCurrentPosition)
    .then(({ user, coords }) => {
      console.log(user, coords)
      if (shouldUpdateLocation(user.coords, coords)) {
        console.log('Updating user location!')
      } else {
        console.log('No need to update location')
      }

      return Promise
        .all([
          location.getCityFromCoords(coords),
          location.getTimezoneFromCoords(coords)
        ])
        .then(([ city, tz ]) => {
          lastPosition.location = city
          lastPosition.tz = tz
          console.log(lastPosition)
          return displaySaveLocationNotification(user, city)
        })
    })
    .catch((err) => {
      console.error(err)
    })
}

const initializeApp = () => {
  getUserData()
    .then(getUserAccessToken)
    .then(checkUserLocationForUpdate)
    .catch(err => {
      if (++initializationAttempts <= 1) {
        displayLoginNotification(err.url)
      }
    })
}

chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse) {
    const method = (message.method || 'GET').toLowerCase();
    let request = null;

    switch (message.resource) {
      case 'self':
        request = api[method]('self', message.data);
        break;
      case 'user':
        request = api[method]('user/' + message.userId, message.data);
        break;
      case 'team':
        request = api[method]('team/' + message.teamId, message.data);
        break;
    }

    request
      .then(res => sendResponse(res) )
      .catch(err => sendResponse({ error: err }) );

    // We must return true since this is async
    return true;
  });

// Gather user settings
chrome.storage.sync.get({
  preferences: {}
}, (data) => {
  preferences = data
})

initializeApp()
