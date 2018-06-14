import proj4 from 'proj4';
import OlMap from 'ol/map';
import OlView from 'ol/view';
import OlAttribution from 'ol/attribution';
import OlCircle from 'ol/style/circle';
// import olEventsCondition from 'ol/events/condition';
import OlFill from 'ol/style/fill';
import OlFormatGeoJSON from 'ol/format/geojson';
import OlFormatWKT from 'ol/format/wkt';
import OlLayerVector from 'ol/layer/vector';
import OlLayerTile from 'ol/layer/tile';
import OlMousePosition from 'ol/control/mouseposition';
import olControl from 'ol/control';
import olCoordinate from 'ol/coordinate';
import olObservable from 'ol/observable';
import olProj from 'ol/proj';
import OlProjection from 'ol/proj/projection';
import OlSourceVector from 'ol/source/vector';
import OlSourceWMTS from 'ol/source/wmts';
import OlStroke from 'ol/style/stroke';
import OlStyle from 'ol/style/style';
import OlTileGridWMTS from 'ol/tilegrid/wmts';
import Log from 'cgil-log';

const DEV = process.env.NODE_ENV === 'development';
const log = new Log('olMapViewJS');
const isNullOrUndefined = variable => ((typeof (variable) === 'undefined') || (variable === null));
export const functionExist = functionName => ((typeof (functionName) !== 'undefined') && (functionName !== null));
const posLausanneSwissCoord = [537892.8, 152095.7];
const zoomLevelLausanne = 7;
export const DIGITIZE_PRECISION = 2; // cm is enough in EPSG:21781

proj4.defs('EPSG:21781', '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs');

export function Conv21781To4326(x, y) {
  const projSource = new proj4.Proj('EPSG:21781');
  const projDest = new proj4.Proj('EPSG:4326');
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

const baseWmtsUrl = 'https://map.lausanne.ch/tiles'; // valid on internet
const RESOLUTIONS = [50, 20, 10, 5, 2.5, 1, 0.5, 0.25, 0.1, 0.05];
const MAX_EXTENT_LIDAR = [532500, 149000, 545625, 161000]; // lidar 2012
const swissProjection = new OlProjection({
  code: 'EPSG:21781',
  extent: MAX_EXTENT_LIDAR,
  units: 'm',
});
olProj.addProjection(swissProjection);

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
  let url = `${baseWmtsUrl}/1.0.0/{Layer}/default/${timestamp
  }/swissgrid_05/{TileMatrix}/{TileRow}/{TileCol}.${extension}`;
  // eslint-disable-next-line
  url = url.replace('http:', location.protocol);
  // noinspection ES6ModulesDependencies
  return new OlSourceWMTS(/** @type {olx.source.WMTSOptions} */{
    // crossOrigin: 'anonymous',
    attributions: [new OlAttribution({
      html: '&copy;<a "href=\'http://www.lausanne.ch/cadastre>Cadastre\'>SGLEA-C Lausanne</a>',
    })],
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
 * @returns {OlMap} : an instance of an OpenLayers Map Object with the WMTS Layers for Lausanne
 */
export function createLausanneMap(
  divMap, centerOfMap = posLausanneSwissCoord,
  zoomLevel = zoomLevelLausanne,
  baseLayer = 'fonds_geo_osm_bdcad_couleur',
) {
  const olMousePosition = new OlMousePosition({
    coordinateFormat: olCoordinate.createStringXY(1),
    projection: 'EPSG:2181',
    /*
    className: 'map-mouse-position',
    target: document.getElementById('mousepos'),
    undefinedHTML: '&nbsp;'
    */
  });
  return new OlMap({
    target: divMap,
    loadTilesWhileAnimating: true,
    // projection: swissProjection,
    controls: olControl.defaults({
      attributionOptions: ({
        collapsible: false,
      }),
    }).extend([olMousePosition]),
    layers: initWmtsLayers(baseLayer),
    view: getOlView(centerOfMap, zoomLevel),
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

export function loadGeoJSONPolygonLayer(olMap, geojsonUrl, loadCompleteCallback) {
  if (DEV) log.t(`# in loadGeoJSONPolygonLayer creating Layer : ${geojsonUrl}`);
  fetch(geojsonUrl)
    .then(response => response.json())
    .then((json) => {
      log.t('# in loadGeoJSONPolygonLayer then((json) => : ', json);
      const vectorSource = new OlSourceVector({
        format: new OlFormatGeoJSON({
          defaultDataProjection: 'EPSG:21781',
          projection: 'EPSG:21781',
        }),
        features: (new OlFormatGeoJSON()).readFeatures(json),
      });
      const newLayer = new OlLayerVector({
        source: vectorSource,
        style: new OlStyle({
          fill: new OlFill({
            color: 'rgba(255, 0, 0, 0.8)',
          }),
          stroke: new OlStroke({
            color: '#191aff',
            width: 3,
          }),
          image: new OlCircle({
            radius: 9,
            fill: new OlFill({
              color: '#ffcc33',
            }),
          }),
        }),
      });
      log.w(`Layer Features : ${getNumberFeaturesInLayer(newLayer)}`, newLayer);
      olMap.addLayer(newLayer);
      const extent = newLayer.getSource().getExtent();
      olMap.getView().fit(extent, olMap.getSize());
      if (functionExist(loadCompleteCallback)) {
        loadCompleteCallback(newLayer);
      }
    });
}

export function addGeoJSONPolygonLayer(olMap, geojsonUrl, loadCompleteCallback) {
  if (DEV) log.t(`# in addGeoJSONPolygonLayer creating Layer : ${geojsonUrl}`);
  const vectorSource = new OlSourceVector({
    url: geojsonUrl,
    format: new OlFormatGeoJSON({
      defaultDataProjection: 'EPSG:21781',
      projection: 'EPSG:21781',
    }),
  });
  /*
   https://openlayers.org/en/latest/examples/draw-and-modify-features.html
   https://openlayers.org/en/latest/examples/modify-features.html
   TODO use a property of the geojson query to display color
   or a style function  : http://openlayersbook.github.io/ch06-styling-vector-layers/example-07.html
   */
  const newLayer = new OlLayerVector({
    source: vectorSource,
    style: new OlStyle({
      fill: new OlFill({
        color: 'rgba(255, 0, 0, 0.8)',
      }),
      stroke: new OlStroke({
        color: '#191aff',
        width: 3,
      }),
      image: new OlCircle({
        radius: 9,
        fill: new OlFill({
          color: '#ffcc33',
        }),
      }),
    }),
  });

  const listenerKey = vectorSource.on('change', (e) => {
    if (DEV) console.warn('getState is ', vectorSource.getState());
    if (vectorSource.getState() === 'ready') {
      // TODO maybe add "loading icon" and here where to hide it
      // retrieve extent of all features to zoom only when loading of the layer
      // via Ajax XHR is complete
      const extent = newLayer.getSource().getExtent();
      if (DEV) {
        console.log(`# Finished Loading Layer : ${geojsonUrl}`, e);
      }
      olMap.getView().fit(extent, olMap.getSize());
      // and unregister the "change" listener
      olObservable.unByKey(listenerKey);
      if (functionExist(loadCompleteCallback)) {
        loadCompleteCallback(newLayer);
      }
    }
  });
  return newLayer;
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
