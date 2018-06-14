<template>
  <div class="map">
    <h4>{{ geojsonurl }}</h4>
    <div ref="mymap" class="map-content"></div>

  </div>
</template>

<script>
import Log from 'cgil-log';
import Map from 'ol/map';
import View from 'ol/view';
import TileLayer from 'ol/layer/tile';
import XYZ from 'ol/source/xyz';

const log = new Log('OlMap');
export default {
  name: 'OlMap',
  data() {
    return {
      Map: null,
    };
  },
  props: {
    geojsonurl: String,
  },
  mounted() {
    log.t('# entering mounted');
    this.olMap = new Map({
      target: this.$refs.mymap,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          }),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  $toolbar-height : 35px;
  @import "~ol/ol.css";
.map {
  box-sizing: border-box;
  border: solid 1px #1b4593;
  background: aqua;
  width: 100%;
  height: 95%;
  margin: 0px 0 0;
  padding: 0;
}

</style>
