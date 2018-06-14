<template>
    <div id="app">
        <!-- here you can put a toolbar
        <lausanne-map class="map-small"
                      :zoom="7"
                      geojsonurl="https://mygolux.lausanne.ch/webservice/geodata/cgtest_get_geojson_geometry.php"/>
        <lausanne-map class="map-small"
                      geojsonurl="https://gomap.lausanne.ch/gomap-api/chantiers"
        baselayer="orthophotos_ortho_lidar_2016"/>
        -->
        <lausanne-map class="map-big"
                      :zoom="2"
                      geojsonurl="https://gomap.lausanne.ch/gomap-api/chantiers">

        </lausanne-map>
    </div>
</template>

<script>
import lausanneMap from './components/lausanneVuejsMap.vue';

export default {
  name: 'app',
  components: {
    lausanneMap,
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
            height: 500px;
            margin: 10px;
            float: left;
        }
    }

</style>
