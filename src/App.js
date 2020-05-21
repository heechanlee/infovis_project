import React, { Component } from 'react';

import {main} from './js/main';
import './App.css';

class App extends Component {
  componentDidMount() {
    main();
  }

  render() {
    return (
      <div className="dashboard">
        <div className="container">
          <svg id = "map"></svg>
          <div id = "selectbox"></div>
          <div id = "slider"></div>
        </div>
        <div className="plot">
        </div>
      </div>
    );
  }
}



export default App;
