import React from 'react';

export default class Avatar extends React.Component {

  render() {
    var style = {
      backgroundImage: `url(${this.props.avatar})`
    };
    return (
      <div className="avatar"
           style={style}
           title={`${this.props.name} - ${this.props.location}`}></div>
    );
  }

}
