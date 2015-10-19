import React, { Component } from 'react';
import classNames from 'classnames';
import TimezoneRow from './TimezoneRow';

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

  handleClickLocation() {

  }

  getVisibleTimezones() {
    if (!this.state.search)
      return this.props.timezones;

    return this.props.timezones
      .map(function(timezone) {
        var filteredTimezone = Object.assign({}, timezone);
        filteredTimezone.people = timezone.people.filter(function(person) {
          return person.name &&
                 person.name.search( new RegExp(this.state.search, 'i') ) > -1;
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

    var headerToolsClasses = classNames('app-header-tools', {
      'is-search-active': this.isSearchActive()
    });

    return (
      <div className="app">

        <div className="app-header">

          <TimezoneRow people={[this.props.user]}
                       time={this.props.time}
                       fmt={this.props.fmt} />

          <div className={headerToolsClasses}>

            <button className="location-button material-icons md-18"
                    onClick={this.handleClickLocation.bind(this)}>place</button>

            <button className="search-button material-icons md-18"
                    onClick={this.handleClickSearch.bind(this)}
                    tabIndex="0">search</button>

            <input className="search-input"
                   type="search"
                   ref="search"
                   valueLink={searchLink}
                   onKeyDown={this.handleSearchKeyDown.bind(this)} />

          </div>

        </div>

        <div className="app-body">
          {this.getVisibleTimezones().map(function(timezone, idx) {
            return <TimezoneRow {...timezone}
                                key={idx}
                                time={this.props.time}
                                fmt={this.props.fmt} />
          }, this)}
        </div>
      </div>
    );
  }

}
