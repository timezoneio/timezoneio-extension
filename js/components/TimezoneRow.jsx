import React, { Component } from 'react';
import Time from './Time';
import Avatar from './Avatar';

export default class TimezoneRow extends Component {

  getLocation() {
    return this.props.people.length === 1 ?
      this.props.people[0].location :
      this.props.tz && this.props.tz.replace(/.+\//,'')
                                    .replace('_', ' ');
  }

  render() {
    return (
      <div className="tz-row">

        <div className="tz-info">
          <Time time={this.props.time}
                fmt={this.props.fmt}
                tz={this.props.tz} />
          <span className="tz-location">
            {this.getLocation().toUpperCase()}
          </span>
        </div>

        <div className="tz-people">
          {this.props.people.map(function(person, idx) {
            return <Avatar {...person} key={idx} />
          })}
        </div>

      </div>
    );
  }

}
