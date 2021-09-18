import React, { useState, useEffect } from 'react';
import GeoJSON from 'ol/format/GeoJSON'
import MapWrapper from './components/MapWrapper'
import * as geojson from '../assets/zones.json';
import './App.css';

function App() {
  const [features, setFeatures] = useState([])
  const [rawFeatures, setRawFeatures] = useState([]);

  useEffect( () => {
    const wktOptions = {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
    }

    const parsedFeatures = new GeoJSON().readFeatures(geojson, wktOptions)

    // set features into state (which will be passed into OpenLayers
    //  map component as props)
    setFeatures(parsedFeatures)
    setRawFeatures(geojson)
  },[])
  
  return (
    <div className="App">
      {/* <div className="app-label">
        <p>React Functional Components with OpenLayers Example</p>
        <p>Click the map to reveal location coordinate via React State</p>
      </div> */}
      
      <MapWrapper features={features} rawFeatures={rawFeatures} />
    </div>
  )
}

export default App