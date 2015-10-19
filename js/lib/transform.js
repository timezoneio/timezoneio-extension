import moment from 'moment-timezone';


function appendOffset(person) {
  if (person.tz) {
    person.utcOffset = moment().tz(person.tz).utcOffset();
  } else {
    person.utcOffset = 720; // make this display all the way to the right
  }
  return person;
}

function sortByTimezone(a, b){
  return a.utcOffset - b.utcOffset;
}

function sortByNameAndId(a, b) {
  return a.name > b.name ? 1 :
         a.name !== b.name ? -1 :
         a._id > b._id ? 1 :
         -1;
}


var transform = {};

transform.teamToTimezones = function(team) {

  var timezones = team.people
    .map(appendOffset)
    .sort(sortByTimezone)
    .reduce(function(zones, person){
      var last = zones[ zones.length - 1 ];
      var utcOffset = last && last.people[0].utcOffset;

      if (last && utcOffset === person.utcOffset) {
        last.people.push(person);
      } else {
        zones.push({
          tz: person.tz,
          people: [ person ]
        });
      }

      return zones;
    }, [])
    .map(function(timezone){
      timezone.people.sort(sortByNameAndId);
      return timezone;
    });

  return timezones;
};


export default transform;
