import React, { useState, useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";
import XYZ from "ol/source/XYZ";
import { transform } from "ol/proj";
import { toStringXY } from "ol/coordinate";
import { fromLonLat, toLonLat } from "ol/proj";
import { ZoomToExtent, defaults as defaultControls } from "ol/control";
import Overlay from "ol/Overlay";
import { toStringHDMS } from "ol/coordinate";
import Geocoder from "ol-geocoder";
import { point, polygon, booleanPointInPolygon } from "@turf/turf";

// out of call radius

function MapWrapper(props) {
    const [map, setMap] = useState();
    const [featuresLayer, setFeaturesLayer] = useState();
    const [selectedCoord, setSelectedCoord] = useState();
    const [showPopup, setShowPopup] = useState(false);
    const [zone, setZone] = useState();
    const mapElement = useRef();

    // create state ref that can be accessed in OpenLayers onclick callback function
    //  https://stackoverflow.com/a/60643670
    const mapRef = useRef();
    mapRef.current = map;

    useEffect(() => {
        const initalFeaturesLayer = new VectorLayer({
            source: new VectorSource(),
        });

        const view = new View({
            center: fromLonLat([-105.0316, 39.571]),
            zoom: 11,
        });

        const initialMap = new Map({
            target: mapElement.current,
            layers: [
                new TileLayer({
                    source: new XYZ({
                        url: "http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
                    }),
                }),
                initalFeaturesLayer,
            ],
            view: view,
            controls: defaultControls().extend([
                new ZoomToExtent({
                    extent: [
                        -11693285.779459544, 4803321.46291971, -11691209.229958646,
                        4804270.538808437,
                    ],
                }),
            ]),
        });

        // set map onclick handler
        initialMap.on("click", handleMapClick);

        setMap(initialMap);
        setFeaturesLayer(initalFeaturesLayer);
    }, []);

    useEffect(() => {
        if (props.features.length) {
            featuresLayer.setSource(
                new VectorSource({
                    features: props.features,
                })
            );

            map.getView().fit(featuresLayer.getSource().getExtent(), {
                padding: [100, 100, 100, 100],
            });

            const geocoder = new Geocoder("nominatim", {
                provider: "osm",
                lang: "en-US",
                placeholder: "Search for ...",
                targetType: "text-input",
                limit: 5,
                keepOpen: true,
                preventDefault: true,
            });
            map.addControl(geocoder);
    
            geocoder.on("addresschosen", e => {
                const coords = e.coordinate;
                console.log(e);
                map.getView().setCenter(coords);
                map.getView().setZoom(17);
    
                console.log('props', props.rawFeatures);
    
                const pt = point(toLonLat(coords));
                const polys = props.rawFeatures.features;

                polys.forEach(poly => {
                    if(booleanPointInPolygon(pt, poly)) {
                        console.log('yep', poly);
                    } else {
                        console.log('nope', poly);
                    }
                });
    
                console.log("contains", booleanPointInPolygon(pt, poly));
            });
        }
    }, [props.features]);

    /**
     * Elements that make up the popup.
     */
    const container = document.getElementById("popup");
    const content = document.getElementById("popup-content");

    /**
     * Create an overlay to anchor the popup to the map.
     */
    const overlay = new Overlay({
        element: container,
        autoPan: true,
        autoPanAnimation: {
            duration: 250,
        },
    });

    const displayFeatureInfo = function (pixel) {
        const feature = mapRef.current.getFeaturesAtPixel(pixel);
        console.log("feature", feature);

        setZone(feature[0].values_.zone);

        // vectorLayer.getFeatures(pixel).then(function (features) {
        //   const feature = features.length ? features[0] : undefined;
        // //   const info = document.getElementById('info');
        //   if (features.length) {
        //       console.log('features', feature.values_.zone)
        //     // info.innerHTML = feature.getId() + ': ' + feature.get('name');
        //   } else {
        //       console.log('no feature')
        //     // info.innerHTML = '&nbsp;';
        //   }
        // });
    };

    const handleMapClick = event => {
        // get clicked coordinate using mapRef to access current React state inside OpenLayers callback
        //  https://stackoverflow.com/a/60643670
        const clickedCoord = mapRef.current.getCoordinateFromPixel(event.pixel);
        const transormedCoord = transform(clickedCoord, "EPSG:3857", "EPSG:4326");

        // const coordinate = event.coordinate;
        // const hdms = toStringHDMS(toLonLat(coordinate));

        // content.innerHTML = "<p>You clicked here:</p><code>" + hdms + "</code>";
        // overlay.setPosition(coordinate);

        mapRef.current.hasFeatureAtPixel(event.pixel) ? displayFeatureInfo(event.pixel) : null;

        setShowPopup(true);
        setSelectedCoord(transormedCoord);
    };

    return (
        <div>
            <div ref={mapElement} className='map-container'></div>

            <div className='clicked-coord-label'>
                <p>{selectedCoord ? toStringXY(selectedCoord, 5) : ""}</p>
            </div>

            {showPopup ? (
                <div className={"lemc-popup"}>{zone}</div>
            ) : // ? <div id='popup' className='ol-popup'>
            //     {/* <a href='#' id='popup-closer' className='ol-popup-closer' onClick={() => closePopup()}></a>
            //     <div id='popup-content'></div> */}
            //     Hello
            // </div>
            null}
        </div>
    );
}

export default MapWrapper;
