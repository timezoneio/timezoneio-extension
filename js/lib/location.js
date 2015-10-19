import qs from 'querystring';

var toRad = (n) => n * Math.PI / 180;

var location = {

  getCurrentPosition: function() {
    return new Promise(function(resolve, reject) {
      navigator.geolocation.getCurrentPosition(function(position) {
        resolve(position.coords);
      }, function(err) {
        reject(err.message);
      });
    });
  },

  getCityFromCoords: function(coords) {
    var base = 'https://maps.googleapis.com/maps/api/geocode/json?';
    var params = {
      sensor: false,
      latlng: coords.lat + ',' + coords.long,
      timestamp: Math.floor(new Date().valueOf() / 1000)
    };

    return fetch(base + qs.stringify(params))
      .then( (res) => res.json() )
      .then(function(data) {
        if (!data.results || !data.results.length)
          return null;

        var cities = data.results
          .map(function(result) {

            // Find the component that is classified as a 'locality'
            var cityComponent = result.address_components.filter(function(component) {
              return component.types.indexOf('locality') >= 0;
            })[0];

            return cityComponent && cityComponent.long_name;
          })
          .filter( (city) => !!city );

        return cities[0];
      });
  },

  getTimezoneFromCoords: function(coords) {
    var base = 'https://maps.googleapis.com/maps/api/timezone/json?';
    var params = {
      location: coords.lat + ',' + coords.long,
      timestamp: Math.floor(new Date().valueOf() / 1000)
    };

    return fetch(base + qs.stringify(params))
      .then( (res) => res.json() )
      .then( (data) => data.timeZoneId );
  },

  // Get the distance in kilometers between two sets of coordinates
  // Returns integer
  calculateDistance: function(lat1, long1, lat2, long2) {
    var R = 6371; // km
    var dLat = toRad(lat2-lat1);
    var dLong = toRad(long2-long1);
    var lat1Rad = toRad(lat1);
    var lat2Rad = toRad(lat2);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLong/2) * Math.sin(dLong/2) *
            Math.cos(lat1Rad) * Math.cos(lat2Rad);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

};

export default location;
