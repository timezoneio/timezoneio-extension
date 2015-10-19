import React from 'react';
import moment from 'moment-timezone';


var Time = (props) => {
  var m = props.tz ? moment(props.time).tz(props.tz) : moment(props.time);
  return <span>{m.format(props.fmt)}</span>;
};

export default Time;
