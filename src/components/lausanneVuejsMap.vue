<template>
    <div class="map">
        <div ref="mymap" class="map-content"></div>
    </div>
</template>

<script>
import Log from 'cgil-log';
import { createLausanneMap, loadGeoJSONPolygonLayer } from './lausanneOlMapView';

const posLausanneGareSwissCoord = [537892.8, 152095.7];
const log = new Log('lausanneVuejsMap');
export default {
  name: 'lausanneVuejsMap',
  data() {
    return {
      Map: null,
      VectorLayer: null,
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
    baselayer: {
      type: String,
      default: 'fonds_geo_osm_bdcad_couleur',
    },
  },
  mounted() {
    log.t(`# entering mounted() geojsonurl:${this.geojsonurl}`);
    log.l(` zoom : ${this.zoom}, geojsonurl:${this.geojsonurl}`);
    this.Map = createLausanneMap(this.$refs.mymap, this.center, this.zoom, this.baselayer);
    log.l('OpenLAyers MAP', this.Map);
    if (this.geojsonurl.length > 4) {
      loadGeoJSONPolygonLayer(this.Map, this.geojsonurl);
    }
  },
};
</script>

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
    }
    .map-content{
        width: 100%;
        height: 100%;
    }

</style>
