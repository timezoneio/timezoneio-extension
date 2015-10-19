import localForage from 'localforage';

const ONE_HOUR = 60 * 60;
const DEFAULT_EXPIRES_IN = ONE_HOUR;

var cache = {

  get: function(key) {
    return localForage
      .getItem(key)
      .then(function(recordObj) {
        var record = recordObj[key];

        if (!record)
          return null;

        if (record.expires && record.expires < Date.now())
          return null;

        return record.data;
      });
  },

  // expiresIn - seconds from now to expire the data in. false means don't expire
  set: function(key, data, expiresIn) {

    var record = {
      [key]: {
        data: data
      }
    };

    if (expiresIn !== false)
      record[key].expires = Date.now() + (1000 * (expiresIn || DEFAULT_EXPIRES_IN));

    return localForage
      .setItem(key, record)
      .then(function(record) {
        return true;
      });
  }

};

export default cache;
