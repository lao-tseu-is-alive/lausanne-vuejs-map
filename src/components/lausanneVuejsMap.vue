<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
    $toolbar-height: 35px;
    @import "~ol/ol.css";
    .map {
        box-sizing: border-box;
        overflow: hidden;
        border: solid 1px #1b4593;
        background: aqua;
        width: 100%;
        height: 95%;
        margin: 0px 0 0;
        padding: 0;
        .message-box {
            border: solid 2px red;
            background-color: #ff511f;
            position: absolute;
            z-index: 100;
        }
        .map-content {
            width: 100%;
            height: 100%;
        }
         .tooltip {
             position: relative;
             padding: 3px;
             background: rgba(0, 0, 0, 0.7);
             width: 40em;
             border-radius: 5px;
             color: white;
             opacity: 0.8;
             font: 12pt Arial;
         }
        /*
        .tooltip {
            position: relative;
            display: inline-block;

            padding: 3px;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            opacity: 0.8;
            max-width: 45em;
            padding: 0.5em;
            // white-space: nowrap;

            .tooltiptext {
                font: 14px Arial sans-serif;
                width: 640px;
                background-color: rgba(0, 0, 0, 0.7);
                color: #fff;
                text-align: center;
                border-radius: 6px;
                padding: 5px 0;
                position: absolute;
                z-index: 1;
                bottom: 150%;
                left: 50%;
                margin-left: -320px;
            }
            .tooltiptext::after {
                content: "";
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -6px;
                border-width: 6px;
                border-style: solid;
                border-color: black transparent transparent transparent;
            }
            */
    }


</style>

<template>
    <div class="map">
        <div v-if="displayAlertMessage" ref="message" class="mesage-box">This is an alert !</div>
        <div ref="mymap" class="map-content">
            <div ref="tooltip" class="tooltip">
                <!--
                <span ref="tooltiptext" class="tooltiptext"></span>
                -->
            </div>
        </div>
    </div>
</template>

<script>
import Log from 'cgil-log';
import OlOverlay from 'ol/Overlay';
import { isNullOrUndefined } from 'cgil-html-utils';
import {
  createLausanneMap,
  loadGeoJsonUrlPolygonLayer,
} from './lausanneOlMapView';

const DEV = process.env.NODE_ENV === 'development';
const log = (DEV) ? new Log('lausanneVuejsMap', 4) : new Log('lausanneVuejsMap', 1);
const posLausanneGareSwissCoord = [537892.8, 152095.7];
export default {
  name: 'lausanneVuejsMap',
  data() {
    return {
      Map: null,
      VectorLayer: null,
      displayAlertMessage: false,
    };
  },
  props: {
    zoom: {
      type: Number,
      default: 13,
    },
    center: {
      type: Array,
      default: () => (posLausanneGareSwissCoord),
    },
    geojsonurl: {
      type: String,
      default: '',
    },
    geojsondata: {
      type: Object,
      default: null,
    },
    baselayer: {
      type: String,
      default: 'fonds_geo_osm_bdcad_couleur',
    },
  },
  mounted() {
    log.t('# entering lausanneVuejsMap.mounted()');
    log.l(`zoom : ${this.zoom} center : ${this.center}`);
    this.Map = createLausanneMap(
      this.$refs.mymap,
      this.center, this.zoom, this.baselayer,
      this.geojsondata, '', this.handleMapClickCoordsXY,
    );
    this.Map.on(
      'pointermove',
      (evt) => {
        const localDebug = false;

        const features = [];
        const x = Number(evt.coordinate[0]).toFixed(2);
        const y = Number(evt.coordinate[1]).toFixed(2);
        const info = {
          coordinates: [x, y],
          numFeaturesDetected: 0,
        };
        const lastfeature = this.Map.forEachFeatureAtPixel(
          evt.pixel,
          (feature, layer) => {
            let layerName = '';
            if (!isNullOrUndefined(layer)) {
              layerName = layer.get('name');
              if (localDebug) log.l(`feature found in layer : "${layerName}"`);
            }
            const featureProps = feature.getProperties();
            // if (localDebug) log.l(`# GoMap pointermove EVENT, feat detect`);
            if (!isNullOrUndefined(featureProps)) {
              const featureInfo = {
                id: featureProps.id,
                feature,
                layer: layerName,
                data: featureProps,
              };
              // log.l(`Feature id : ${feature_props.id}, info:`, info);
              features.push(featureInfo);
            } else {
              features.push({
                id: 0,
                feature,
                layer: layerName,
              });
            }
            // return feature
          },
        ); // end of forEachFeatureAtPixel
        if (localDebug) log.l('GoMap pointermove EVENT -> lastfeature:', lastfeature);
        if (features.length > 0) {
          if (localDebug) log.l('GoMap pointermove EVENT ->Array of features found :', features);
          info.numFeaturesDetected = features.length;
          info.features = features;
          let strToolTip = '';
          const arrTitle = [];
          features.forEach((featInfo) => {
            const currentTitle = featInfo.data.title;
            if (!isNullOrUndefined(currentTitle)) {
              arrTitle.push(`${currentTitle.replace(/(<([^>]+)>)/ig, '')}<br>`);
            }
          });
          strToolTip = arrTitle.join('<hr>');
          if (strToolTip.length > 0) {
            this.ol_Overlay.setPosition(evt.coordinate);
            this.$refs.tooltip.style.display = '';
            this.$refs.tooltip.innerHTML = `${strToolTip}`;
            this.$refs.mymap.style.cursor = 'pointer';
          } else {
            this.$refs.tooltip.innerHTML = '';
            this.$refs.tooltip.style.display = 'none';
          }
        } else {
          info.numFeaturesDetected = 0;
          info.features = null;
          this.$refs.tooltip.style.display = 'none';
          this.$refs.mymap.style.cursor = '';
        }
      },
    );
    // OVERLAY FOR TOOLTIP
    this.ol_Overlay = new OlOverlay({
      element: this.$refs.tooltip,
      offset: [10, -10],
      positioning: 'bottom-center',
    });
    this.Map.addOverlay(this.ol_Overlay);
    // log.l('OpenLAyers MAP', this.Map);
    if (this.geojsonurl.length > 4) {
      log.l(`will enter in loadGeoJsonUrlPolygonLayer(geojsonurl:${this.geojsonurl}`);
      loadGeoJsonUrlPolygonLayer(this.Map, this.geojsonurl);
    }
  },
  methods: {
    handleMapClickCoordsXY(x, y) {
      log.t(`# entering handleMapClickCoordsXY(${x}, ${y})`);
      const feature = this.Map.forEachFeatureAtPixel(
        this.Map.getPixelFromCoordinate([x, y]),
        (feat, layer) => {
          log.l('layer found :', layer);
          // you can add a condition on layer to restrict the listener
          return feat;
        },
      );
      if (!isNullOrUndefined(feature)) {
        log.l('Feature found :', feature);
        const val = feature.getProperties();
        if (!isNullOrUndefined(val)) {
          log.l(`Feature id : ${val.id}`);
          // TODO : send back this to parent callback
          const info = { coordinates: [x, y], id: val.id };
          this.$emit('mapclick', info);
          // case of an iframe containing a function getMapClickCoordsXY
          // removed for now beacaused it get called also when no iln -sframe
          // if (typeof (window.parent.getMapClickCoordsXY) !== 'undefined') {
          //  window.parent.getMapClickCoordsXY(info);
          // }
          // case of a function getMapClickCoordsXY in global context in window
          if (typeof (window.getMapClickCoordsXY) !== 'undefined') {
            window.getMapClickCoordsXY(info);
          }
        }
      }
    },
  },
};
</script>
