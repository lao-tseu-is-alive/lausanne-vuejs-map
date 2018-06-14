<template>
  <div id="app">
    <!-- here you can put a toolbar -->
    <ol-map geojsonurl="https://mygolux.lausanne.ch/webservice/geodata/cgtest_get_geojson_geometry.php"/>
  </div>
</template>

<script>
import olMap from './components/olmap.vue';

export default {
  name: 'app',
  components: {
    olMap,
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
  color: #2c3e50;
  margin: 0px;
  width: 100%;
  height: 750px;


}
</style>
