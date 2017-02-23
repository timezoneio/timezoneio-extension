const loginStatus = document.querySelector('.js-login-status')
const loginButton = document.querySelector('.js-login-button')
const locationPreferenceSelector = '.js-location-update-preference'
const locationPreferenceRadios = document.querySelectorAll(locationPreferenceSelector)
const savedNotification = document.querySelector('.js-saved')

const checkLoggedInStatus = () => {
  chrome.runtime.sendMessage({ resource: 'self' }, (res) => {
    if (res._id) {
      loginStatus.innerText = `You're logged in!`
      loginButton.classList.add('hidden')
    } else {
      loginStatus.innerText = `Please login to active the extension:`
      loginButton.classList.remove('hidden')
    }
  })
}

const openLoginTab = (loginUrl) => {
  let loginTabId = null

  const onTabClose = (tabId, removeInfo) => {
    if (tabId === loginTabId) {
      loginTabId = null
      chrome.tabs.onRemoved.removeListener(onTabClose)
      checkLoggedInStatus()
    }
  }

  chrome.tabs.create({ url: loginUrl }, (tab) => {
    loginTabId = tab.id
    chrome.tabs.onRemoved.addListener(onTabClose)
  })
}

const showSaved = () => {
  savedNotification.classList.remove('hidden')
  window.setTimeout(() => savedNotification.classList.add('hidden'), 2000)
}

const onSettingChange = () => {
  let value = null
  locationPreferenceRadios.forEach((el) => {
    if (el.checked) {
      value = el.value
    }
  })
  chrome.storage.sync.set({
    preferences: {
      locationUpdate: value
    }
  }, showSaved)
}

locationPreferenceRadios.forEach((el) => {
  el.addEventListener('change', onSettingChange)
})

loginButton.addEventListener('click', (e) => openLoginTab(res.error.url))
window.addEventListener('focus', checkLoggedInStatus)

checkLoggedInStatus()


