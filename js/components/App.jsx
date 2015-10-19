import React, { Component } from 'react';
import classNames from 'classnames';
import Avatar from './Avatar';
import Time from './Time';

const ESC_KEY = 27;

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      search: null
    };
  }

  componentDidMount() {
    // So we can remove it later
    this.handleWindowKeydown = this.handleWindowKeydown.bind(this);
    window.addEventListener('keydown', this.handleWindowKeydown);
  }

  componentDidUpdate() {
    if (this.isSearchActive())
      this.refs.search.focus();
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleWindowKeydown);
  }

  isSearchActive() {
    return this.state.search !== null;
  }

  handleWindowKeydown(e) {
    if (!this.isSearchActive() && e.key && e.key === '/') {
      e.preventDefault();
      this.setState({ search: '' });
    }
  }

  handleClickSearch() {
    this.setState({ search: '' });
  }

  handleSearchChange(value) {
    this.setState({ search: value });
  }

  handleSearchKeyDown(e) {
    // Close the search form if they they hit escape and the form is empty
    if (e.keyCode === ESC_KEY && this.state.search.length === 0)
      this.setState({ search: null });
  }

  getVisibleTimezones() {
    if (!this.state.search)
      return this.props.timezones;

    return this.props.timezones
      .map(function(timezone) {
        var filteredTimezone = Object.assign({}, timezone);
        filteredTimezone.people = timezone.people.filter(function(person) {
          return person.name &&
                 person.name.toLowerCase().indexOf(this.state.search) > -1;
        }.bind(this));
        return filteredTimezone;
      }, this)
      .filter(function(timezone) {
        return timezone.people.length;
      });
  }

  render() {

    var searchLink = {
      value: this.state.search,
      requestChange: this.handleSearchChange.bind(this)
    };

    var searchClasses = classNames('search', {
      'search-show-search': this.isSearchActive()
    });

    return (
      <div className="app">

        <div className="app-header">
          <div className="tz-row">
            <div className="tz-time">
              <Time time={this.props.time}
                    fmt={this.props.fmt} />
            </div>
            <div className="tz-people">
              <Avatar {...this.props.user} />
            </div>
          </div>
          <div className={searchClasses}>
            <button className="search-button material-icons md-18"
                    onClick={this.handleClickSearch.bind(this)}>search</button>
            <input className="search-input"
                   type="search"
                   ref="search"
                   valueLink={searchLink}
                   onKeyDown={this.handleSearchKeyDown.bind(this)} />
          </div>
        </div>

        <div className="app-body">
          {this.getVisibleTimezones().map(function(timezone, idx) {
            return (
              <div className="tz-row"
                   key={idx}>
                <div className="tz-time">
                  <Time time={this.props.time}
                        fmt={this.props.fmt}
                        tz={timezone.tz} />
                </div>
                <div className="tz-people">
                  {timezone.people.map(function(person, idx) {
                    return <Avatar {...person} key={idx} />
                  })}
                </div>
              </div>
            );
          }, this)}
        </div>
      </div>
    );
  }

}
