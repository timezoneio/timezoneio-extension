/* globals chrome */
import api from './lib/api'
import { MIN_DISTANCE_TO_UPDATE, LOGIN_URL } from './lib/constants'
import location from './lib/location'
import config from '../config.json'

const ALARM_NAME = 'periodic-location-check'
const PERIODIC_MSG = `Running periodic location change check. NOTE - Will only save location if user
has moved more than ${MIN_DISTANCE_TO_UPDATE}km from last saved position`

let user = null
let userDataLastUpdated = null
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
let lastLocationCheck = null


// TODO - Add auth flow w/ API key
const getUserAccessToken = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get({ accessToken: null }, (data) => {
      if (data.accessToken) {
        api.setAccessToken(data.accessToken)
        resolve()
      } else {
        api.get(`client/${config.clientId}/token`, { secret: config.clientSecret })
          .then(res => {
            api.setAccessToken(res.token)
            chrome.storage.sync.set({ accessToken: res.token }, resolve)
          })
          .catch(err => {
            console.error('Error getting access token: ', err)
            reject()
          })
      }
    })
  })
}

const getUserData = () => {
  return api.get('self').then(res => {
    user = res
    userDataLastUpdated = new Date()
    return user
  })
}

const getCurrentPosition = (user) => {
  if (lastLocationCheck > (new Date() - 60 * 1000)) {
    return Promise.reject('Skipping check')
  }
  lastLocationCheck = new Date()
  return location.getCurrentPosition()
    .then((position) => {
      lastPosition.coords.lat = position.latitude;
      lastPosition.coords.long = position.longitude;
      return { user, coords: lastPosition.coords }
    })
    .catch((err) => console.error('Could not get location:', err))
}

const isMinDistanceToUpdate = (oldCoords, newCoords) => {
  if (!oldCoords || !oldCoords.lat) {
    return true
  }
  const distance = location.calculateDistance(oldCoords.lat, oldCoords.long, newCoords.lat, newCoords.long)
  return distance >= MIN_DISTANCE_TO_UPDATE
}

const saveNewUserLocation = () => {
  console.log('Saving new location!', lastPosition)
  return api.put(`user/${user._id}`, lastPosition)
    .then(res => {
      // Update local user data
      user = res
      console.log('New user location saved!', user)
      return user
    })
    .catch(err => console.error('Failed to save new user location'))
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
  })
}

const displayAutomaticSaveLocationNotification = (city) => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icons/256.png',
    title: `Welcome to ${city}!`,
    message: `Your team will be able to see this the next time they user Timezone.io`,
  }, (notificationId) => {
    BUTTON_CALLBACKS[notificationId] = (buttonIdx) => chrome.notifications.clear(notificationId)
  })
}

// The main mechanism to check for new location changes
const registerForPeriodicUpdates = () => {
  // We check every 6 hours
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 6 * 60 })
}

const processNewUserLocation = ({ user, coords }) => {
  registerForPeriodicUpdates()

  if (preferences.locationUpdate === 'disabled') {
    console.log('User chooses to update location manually')
    return
  }

  if (!isMinDistanceToUpdate(user.coords, coords)) {
    console.log('No need to update location')
    return
  }

  return Promise
    .all([
      location.getCityFromCoords(coords),
      location.getTimezoneFromCoords(coords)
    ])
    .then(([ city, tz ]) => {
      lastPosition.location = city
      lastPosition.tz = tz
      console.log(`User is now in ${city} (${tz})`)

      if (preferences.locationUpdate === 'ask') {
        return displaySaveLocationNotification(user, city)
      }

      // default is automatic
      return saveNewUserLocation()
        .then(() => displayAutomaticSaveLocationNotification(city))
        .catch((err) => console.error(err))
    })
}

const checkUserAndLocationForUpdate = () => {
  getUserData()
    .then(getCurrentPosition)
    .then(processNewUserLocation)
    .catch((err) => console.error(err))
}

const runPeriodicLocationUpdate = () => {
  console.log(PERIODIC_MSG)
  // Update user data every 24 hours
  const twentyFourHoursAgo = new Date() - 24 * 60 * 60 * 1000
  if (userDataLastUpdated < twentyFourHoursAgo) {
    checkUserAndLocationForUpdate()
  } else {
    getCurrentPosition(user)
      .then(processNewUserLocation)
      .catch((err) => console.error(err))
  }
}

const initializeApp = () => {
  getUserData()
    .then(getUserAccessToken)
    .then(checkUserAndLocationForUpdate)
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
  preferences = data.preferences
  console.log(`User location update preference set to ${preferences.locationUpdate}`)
  initializeApp()
})

// Update location when timer is called
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    runPeriodicLocationUpdate()
  }
})


