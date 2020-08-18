<template>
  <v-app>
    <v-content>
      <v-app-bar
        app
        color="primary"
        dark
      >
        <div class="d-flex align-center">
          <span> Map View Demo </span>
        </div>

        <v-spacer></v-spacer>
      </v-app-bar>

      <v-container pa-0 fill-height fluid>
        <MapBoxView />
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import MapBoxView from './views/MapBoxView';

export default {
  name: 'App',

  components: {
    MapBoxView
  },

  data: () => ({
    //
  }),
};
</script>
