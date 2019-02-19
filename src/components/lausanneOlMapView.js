import proj4 from 'proj4';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
// import OlCollection from 'ol/Collection';
import OlCircle from 'ol/style/Circle';
// import { singleClick, shiftKeyOnly, altKeyOnly } from 'ol/events/condition';
// import OlFeature from 'ol/Feature';
import OlFill from 'ol/style/Fill';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlFormatWKT from 'ol/format/WKT';
// import OlInteractionDraw from 'ol/interaction/Draw';
// import OlInteractionModify from 'ol/interaction/Modify';
// import OlInteractionSelect from 'ol/interaction/Select';
// import OlInteractionTranslate from 'ol/interaction/Translate';
import OlLayerVector from 'ol/layer/Vector';
import OlLayerTile from 'ol/layer/Tile';
import OlMousePosition from 'ol/control/MousePosition';
// import OlMultiPolygon from 'ol/geom/MultiPolygon';
import { defaults as defaultControls } from 'ol/control';
import { createStringXY } from 'ol/coordinate';
// import olObservable from 'ol/Observable';
import { addProjection, get } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import OlProjection from 'ol/proj/Projection';
import OlSourceVector from 'ol/source/Vector';
import OlSourceWMTS from 'ol/source/WMTS';
import OlStroke from 'ol/style/Stroke';
import OlStyle from 'ol/style/Style';
import OlTileGridWMTS from 'ol/tilegrid/WMTS';
import Log from 'cgil-log';
import { isNullOrUndefined, functionExist } from 'cgil-html-utils';

const DEV = process.env.NODE_ENV === 'development';
const log = (DEV) ? new Log('olMapViewJS', 5) : new Log('olMapViewJS', 1);

const posLausanneSwissCoord = [537892.8, 152095.7];
const zoomLevelLausanne = 7;
export const DIGITIZE_PRECISION = 2; // cm is enough in EPSG:21781
// TODO adapter url ci-dessous /interne - externe
const baseInternalWmtsUrl = 'https://tiles01.lausanne.ch/tiles'; // valid on internet
// const baseWmtsUrl = 'https://map.lausanne.ch/tiles'; // valid on internet
const RESOLUTIONS = [50, 20, 10, 5, 2.5, 1, 0.5, 0.25, 0.1, 0.05];
const MAX_EXTENT_LIDAR = [532500, 149000, 545625, 161000]; // lidar 2012
proj4.defs('EPSG:21781', '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs');
proj4.defs('EPSG:2056', '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs');

register(proj4);
const olSwissProjection = get('EPSG:21781');
// olSwissProjection.setExtent([485071.54, 75346.36, 828515.78, 299941.84]);
olSwissProjection.setExtent(MAX_EXTENT_LIDAR);


const swissProjection = new OlProjection({
  code: get('EPSG:21781'),
  extent: MAX_EXTENT_LIDAR,
  units: 'm',
});
addProjection(swissProjection);


export function Conv21781To4326(x, y) {
  const projSource = new proj4.Proj('EPSG:21781');
  const projDest = new proj4.Proj('EPSG:4326');
  return proj4.transform(projSource, projDest, [x, y]);
}
// 2056 MN95 new Swiss Projection
export function Conv21781To2056(x, y) {
  const projSource = new proj4.Proj('EPSG:21781');
  const projDest = new proj4.Proj('EPSG:2056');
  return proj4.transform(projSource, projDest, [x, y]);
}
export function Conv4326To21781(x, y) {
  const projSource = new proj4.Proj('EPSG:4326');
  const projDest = new proj4.Proj('EPSG:21781');
  return proj4.transform(projSource, projDest, [x, y]);
}

export function Conv3857To21781(x, y) {
  const projSource = new proj4.Proj('EPSG:3857');
  const projDest = new proj4.Proj('EPSG:21781');
  return proj4.transform(projSource, projDest, [x, y]);
}

function fetchStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response);
  }
  return Promise.reject(new Error(response.statusText));
}

/**
 * Allow to retrieve a valid OpenLayers WMTS source object
 * @param {string} layer  : the name of the WMTS layer
 * @param {object} options
 * @return {ol.source.WMTS} : a valid OpenLayers WMTS source
 */
function wmtsLausanneSource(layer, options) {
  let resolutions = RESOLUTIONS;
  if (Array.isArray(options.resolutions)) {
    // eslint-disable-next-line
    resolutions = options.resolutions;
  }
  const tileGrid = new OlTileGridWMTS({
    origin: [420000, 350000],
    resolutions,
    matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  });
  const extension = options.format || 'png';
  const timestamp = options.timestamps;
  let url = `${baseInternalWmtsUrl}/1.0.0/{Layer}/default/${timestamp
  }/swissgrid_05/{TileMatrix}/{TileRow}/{TileCol}.${extension}`;
  // eslint-disable-next-line
  url = url.replace('http:', location.protocol);
  // noinspection ES6ModulesDependencies
  return new OlSourceWMTS(/** @type {olx.source.WMTSOptions} */{
    // crossOrigin: 'anonymous',
    attributions: '&copy;<a "href=\'http://www.lausanne.ch/cadastre>Cadastre\'>SGLEA-C Lausanne</a>',
    url,
    tileGrid,
    layer,
    requestEncoding: 'REST',
  });
}

function initWmtsLayers(initialBaseLayer) {
  const arrayWmts = [];
  arrayWmts.push(new OlLayerTile({
    title: 'Plan ville couleur',
    type: 'base',
    visible: (initialBaseLayer === 'fonds_geo_osm_bdcad_couleur'),
    source: wmtsLausanneSource('fonds_geo_osm_bdcad_couleur', {
      timestamps: [2015],
      format: 'png',
    }),
  }));
  arrayWmts.push(new OlLayerTile({
    title: 'Plan cadastral (gris)',
    type: 'base',
    visible: (initialBaseLayer === 'fonds_geo_osm_bdcad_gris'),
    source: wmtsLausanneSource('fonds_geo_osm_bdcad_gris', {
      timestamps: [2015],
      format: 'png',
    }),
  }));
  arrayWmts.push(new OlLayerTile({
    title: 'Orthophoto 2012',
    type: 'base',
    visible: (initialBaseLayer === 'orthophotos_ortho_lidar_2012'),
    source: wmtsLausanneSource('orthophotos_ortho_lidar_2012', {
      timestamps: [2012],
      format: 'png',
    }),
  }));
  arrayWmts.push(new OlLayerTile({
    title: 'Orthophoto 2016',
    type: 'base',
    visible: (initialBaseLayer === 'orthophotos_ortho_lidar_2016'),
    source: wmtsLausanneSource('orthophotos_ortho_lidar_2016', {
      timestamps: [2016],
      format: 'png',
    }),
  }));
  arrayWmts.push(new OlLayerTile({
    title: 'Carte Nationale',
    type: 'base',
    visible: (initialBaseLayer === 'fonds_geo_carte_nationale_msgroup'),
    source: wmtsLausanneSource('fonds_geo_carte_nationale_msgroup', {
      timestamps: [2014],
      format: 'png',
    }),
  }));
  return arrayWmts;
}

export function getPolygonStyle(
  feature,
  resolution,
  options = {
    fill_color: 'rgba(255, 0, 0, 0.8)',
    stroke_color: '#191aff',
    stroke_width: 3,
  },
) {
  if (DEV) {
    log.t('## Entering getStyle with feature :', feature);
    log.t(`resolution : ${resolution}`);
  }
  let props = null;
  let theStyle = null;
  if (!isNullOrUndefined(feature) && !isNullOrUndefined(feature.getProperties())) {
    props = feature.getProperties();
    const id = isNullOrUndefined(props.id) ? '#INCONNU#' : props.id;
    if (DEV) log.t(`id : ${id}`);
    theStyle = new OlStyle({
      fill: new OlFill({
        color: isNullOrUndefined(props.fill_color) ? options.fill_color : props.fill_color,
      }),
      stroke: new OlStroke({
        color: isNullOrUndefined(props.stroke_color) ? options.stroke_color : props.stroke_color,
        width: isNullOrUndefined(props.stroke_width) ? options.stroke_width : props.stroke_width,
      }),
      image: new OlCircle({
        radius: isNullOrUndefined(props.stroke_width) ? options.stroke_width : props.stroke_width,
        fill: new OlFill({
          color: isNullOrUndefined(props.fill_color) ? options.fill_color : props.fill_color,
        }),
      }),
    });
  } else {
    theStyle = new OlStyle({
      fill: new OlFill({
        color: options.fill_color, // 'rgba(255, 0, 0, 0.8)',
      }),
      stroke: new OlStroke({
        color: options.stroke_color, // '#191aff',
        width: options.stroke_width,
      }),
      image: new OlCircle({
        radius: 9,
        fill: new OlFill({
          color: '#ffcc33',
        }),
      }),
    });
  }
  return theStyle;
}

export function getVectorSourceGeoJson(geoJsonData) {
  return new OlSourceVector({
    format: new OlFormatGeoJSON({
      defaultDataProjection: 'EPSG:21781',
      projection: 'EPSG:21781',
    }),
    features: (new OlFormatGeoJSON()).readFeatures(geoJsonData),
  });
}

export function getNumberFeaturesInLayer(olLayer) {
  if (isNullOrUndefined(olLayer)) {
    return 0;
  }
  const source = olLayer.getSource();
  const arrFeatures = source.getFeatures();
  return arrFeatures.length;
}

export function loadGeoJsonUrlPolygonLayer(
  olMap,
  geojsonUrl,
  name = 'geojson_url_layer',
  makeZoom2extent = true,
  loadCompleteCallback,
) {
  log.t(`# in loadGeoJsonUrlPolygonLayer creating Layer : ${geojsonUrl}`);
  const layerName = name;
  fetch(geojsonUrl)
    .then(fetchStatus)
    .then(response => response.json())
    .then((json) => {
      log.t('# in loadGeoJSONPolygonLayer then((json) => : ', json);
      const vectorSource = getVectorSourceGeoJson(json);
      const newLayer = new OlLayerVector({
        title: layerName,
        name: layerName,
        source: vectorSource,
        style: getPolygonStyle,
      });
      log.l(`CREATED Layer ${layerName}, with ${getNumberFeaturesInLayer(newLayer)} features !`, newLayer);
      olMap.addLayer(newLayer);
      if (makeZoom2extent) {
        const extent = newLayer.getSource().getExtent();
        olMap.getView().fit(extent, olMap.getSize());
      }
      if (functionExist(loadCompleteCallback)) {
        loadCompleteCallback(newLayer);
      }
    })
    .catch((error) => {
      // TODO find a way to send back this error to client
      log.e(`loadGeoJSONPolygonLayer # FETCH REQUEST FAILED with url: ${geojsonUrl}`, error);
    });
}

export function addGeoJSONPolygonLayer(olMap, geoJsonData) {
  if (DEV) log.t(`# in addGeoJSONPolygonLayer creating Layer : ${geoJsonData}`);
  const vectorSource = getVectorSourceGeoJson(geoJsonData);
  /*
   https://openlayers.org/en/latest/examples/draw-and-modify-features.html
   https://openlayers.org/en/latest/examples/modify-features.html
   TODO use a property of the geojson query to display color
   or a style function  : http://openlayersbook.github.io/ch06-styling-vector-layers/example-07.html
   */
  const newLayer = new OlLayerVector({
    source: vectorSource,
    style: getPolygonStyle,
  });
  olMap.addLayer(newLayer);
  const extent = newLayer.getSource().getExtent();
  olMap.getView().fit(extent, olMap.getSize());
}


/**
 * creates an OpenLayers View Object
 * @param {array} centerView : an array [x,y] representing initial initial center of the view
 * @param {number} zoomView : an integer from 1 to 12 representing the level of zoom
 * @returns {OlView} : the OpenLayers View object
 */
export function getOlView(centerView = posLausanneSwissCoord, zoomView = 12) {
  return new OlView({
    projection: swissProjection,
    center: centerView,
    minZoom: 1,
    maxZoom: 10,
    extent: MAX_EXTENT_LIDAR,
    zoom: zoomView,
  });
}

/**
 * creates an OpenLayers Map Object
 * @param {string} divMap : the html div element that will contain the map
 * @param {array} centerOfMap : [x,y] Swiss Coordinates of the initial center of the view EPSG21781
 * @param {number} zoomLevel : an integer from 1 to 12 representing the level of zoom
 * @param {string} baseLayer : the name of one of the WMTS Lausanne base layers
 * @param {Object} geojsonData: a geojson object to draw in this map
 * @param {string} geojsonUrl: an url to retrieve a geojson (geojsonData should be null)
 * @param {function} clickCallback: a callback function to execute after a click on the map
 * @returns {OlMap} : an instance of an OpenLayers Map Object with the WMTS Layers for Lausanne
 */
export function createLausanneMap(
  divMap, centerOfMap = posLausanneSwissCoord,
  zoomLevel = zoomLevelLausanne,
  baseLayer = 'fonds_geo_osm_bdcad_couleur',
  geojsonData = null,
  geojsonUrl = '',
  clickCallback = null,
) {
  if (DEV) log.t(`# in createLausanneMap with zoomLevel : ${zoomLevel}`, geojsonData);
  const olMousePosition = new OlMousePosition({
    coordinateFormat: createStringXY(1),
    projection: 'EPSG:2181',
    /*
    className: 'map-mouse-position',
    target: document.getElementById('mousepos'),
    undefinedHTML: '&nbsp;'
    */
  });
  const arrLayers = initWmtsLayers(baseLayer);
  let newLayer = null;
  const layerName = 'geojson_data_layer';
  if (!isNullOrUndefined(geojsonData)) {
    log.l(`####will load GeoJSON Polygon Layer( geojsondata:${geojsonData.features.lenght}`, geojsonData);
    const vectorSource = getVectorSourceGeoJson(geojsonData);
    newLayer = new OlLayerVector({
      title: layerName,
      name: layerName,
      source: vectorSource,
      style: getPolygonStyle,
    });
    log.l(`Layer Features : ${getNumberFeaturesInLayer(newLayer)}`, newLayer);
    arrLayers.push(newLayer);
  }

  const myMap = new OlMap({
    target: divMap,
    loadTilesWhileAnimating: true,
    // projection: swissProjection,
    controls: defaultControls({
      attributionOptions: ({
        collapsible: false,
      }),
    }).extend([olMousePosition]),
    layers: arrLayers,
    view: getOlView(centerOfMap, zoomLevel),
  });
  if (!isNullOrUndefined(geojsonData)) {
    const extent = newLayer.getSource().getExtent();
    myMap.getView().fit(extent, myMap.getSize());
  }
  if (geojsonUrl.length > 4) {
    log.l(`will enter in loadGeoJsonUrlPolygonLayer(geojsonurl:${geojsonUrl}`);
    loadGeoJsonUrlPolygonLayer(myMap, geojsonUrl);
  }
  // gestion des click sur la carte
  myMap.on('click', (evt) => {
    if (DEV) {
      log.t('# in Map click EventHandler evt:', (evt)); // coord nationale suisse
      log.l(myMap.getPixelFromCoordinate(evt.coordinate)); // coord pixel
    }
    if (functionExist(clickCallback)) {
      clickCallback(evt.coordinate[0], evt.coordinate[1]);
    } else {
      // nobody seems to care about the coordinates of this click
    }
  });
  return myMap;
}


export function findFeaturebyId(olLayer, idFieldName, id) {
  const source = olLayer.getSource();
  const arrFeatures = source.getFeatures();
  for (let i = 0; i < arrFeatures.length; i += 1) {
    if (arrFeatures[i].getProperties()[idFieldName] === id) {
      return arrFeatures[i];
    }
  }
  return null;
}

export function getFeatureExtentbyId(olLayer, idFieldName, id) {
  const feature = this.findFeaturebyId(olLayer, idFieldName, id);
  if (feature != null) {
    return feature.getGeometry().getExtent();
  }
  return null;
}

export function getWktGeomFromFeature(olFeature) {
  const formatWKT = new OlFormatWKT();
  const geom = olFeature.getGeometry();
  const geometryType = geom.getType().toUpperCase();
  if (geometryType === 'POLYGON') {
    const exteriorRingCoords = geom.getLinearRing(0).getCoordinates()
      .map(p => p.map(v => parseFloat(Number(v).toFixed(DIGITIZE_PRECISION))));
    geom.setCoordinates([exteriorRingCoords], 'XY');
  }
  return formatWKT.writeFeature(olFeature);
}

/**
 * Allow to get a string representation of the feature
 * @param {ol.Feature} olFeature : the feature of geometry type Polygon you want to dump
 * @return {string} : the string representation of this feature
 */
export function dumpFeatureToString(olFeature) {
  const featureWKTGeometry = getWktGeomFromFeature(olFeature);
  const geometryType = olFeature.getGeometry().getType().toUpperCase();
  const rev = olFeature.getRevision();
  const id = olFeature.getId();
  const featureString = `${geometryType} Feature id=${id}  : (rev ${rev}) -\n${featureWKTGeometry}\n`;
  return featureString;
}

export function getWktGeometryFeaturesInLayer(olLayer) {
  if (isNullOrUndefined(olLayer)) {
    return null;
  }
  if (DEV) { console.log('--> getWktGeometryFeaturesInLayer '); }
  const source = olLayer.getSource();
  const arrFeatures = source.getFeatures();
  if (DEV) { console.log(`--> found ${arrFeatures.length} Features`); }
  let strGeom = '';
  if (arrFeatures.length > 0) {
    for (let i = 0; i < arrFeatures.length; i += 1) {
      const featureString = dumpFeatureToString(arrFeatures[i]);
      strGeom += featureString;
    }
  }
  return strGeom;
}

export function getLayerByName(olMap, layerName) {
  const layerFound = [];
  olMap.getLayers().forEach((layer) => {
    if (layer.get('name') !== undefined && layer.get('name') === layerName) {
      layerFound.push(layer);
    }
  });
  if (layerFound.length > 0) {
    return layerFound[0];
  }
  return null;
}
