<template>
    <div id="app">
        <!-- here you can put a toolbar
        <lausanne-map class="map-small"
                      :zoom="7"
                      :geojsondata="geojson"
                      ></lausanne-map>
        <lausanne-map class="map-small"
                      :zoom="2"
                      geojsonurl="https://gomap.lausanne.ch/gomap-api/chantiers"
        baselayer="orthophotos_ortho_lidar_2016"/>
        -->

        <lausanne-map class="map-big"
                      :zoom="7"
                      :center="[538930, 152847]"
                      :zoom2geojson="false"
                      :geojsondata="geojson"
        @mapclick="handleClick"
                      baselayer="fonds_geo_osm_bdcad_gris"
        >
        </lausanne-map>

    </div>
</template>

<script>
import Log from 'cgil-log';
import lausanneMap from './components/lausanneVuejsMap.vue';
import { geodata } from './data';

const log = new Log('lausanneVuejsMap');
export default {
  name: 'app',
  components: {
    lausanneMap,
  },
  data() {
    return {
      geojson: geodata,
    };
  },
  mounted() {
    log.t('## entering app.mounted()', this.geojson);
  },
  methods: {
    handleClick: (data) => {
      log.t('## entering handleClick(evt) data', data);
    },
  },
};
</script>

<style lang="scss">
    html body {
        margin: 0;
    }

    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        display: flex;
        justify-content: center;
        color: #2c3e50;
        background: #e7e7e7;
        margin: 0px;
        width: 100%;
        height: 850px;
        .map-small {
            width: 500px;
            height: 400px;
            margin: 10px;
            float: left;
        }
        .map-big {
            width: 100%;
            height: 100%;
            margin: 10px;
            float: left;
        }
    }

</style>
