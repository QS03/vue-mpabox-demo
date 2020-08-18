<template>
<v-layout ma-1 row wrap>  
  <v-row>
      <v-col cols="12">
      <v-card class="pl-4 pr-4">
        <v-row>
          <v-col  cols="4">
            <v-select
              label="View Mode"
              :items="viewModes"
              v-model="viewMode"
              item-value="value"
              item-text="text"
              @change="changeViewMode"
            ></v-select>
          </v-col>
          <v-col cols="2">            
          </v-col>
          <v-col cols="6">
            <v-row>
              <v-col cols="12">
                <v-combobox
                  label="Select States in USA"
                    :items="locations"
                    v-model="location"
                    item-text="place_name"
                    
                    @change="changeLocation"
                    @keydown="keydownLocation"
                  >            
                  </v-combobox>
              </v-col>
              <v-col cols="12">
                <v-range-slider
                  v-model="range"
                  :max="max"
                  :min="min"
                  hide-details
                  class="align-center"
                >
                  <template v-slot:prepend>
                    <v-text-field
                      :value="range[0]"
                      class="mt-0 pt-0"
                      hide-details
                      single-line
                      type="number"
                      style="width: 60px"
                      @change="$set(range, 0, $event)"
                    ></v-text-field>
                  </template>
                  <template v-slot:append>
                    <v-text-field
                      :value="range[1]"
                      class="mt-0 pt-0"
                      hide-details
                      single-line
                      type="number"
                      style="width: 60px"
                      @change="$set(range, 1, $event)"
                    ></v-text-field>
                  </template>
                </v-range-slider>
              </v-col>
            </v-row>          
        </v-col>
        </v-row>
        </v-card>
      </v-col>
      <v-col cols="12" style="height: 80%;">
      <MglMap
          :accessToken="accessToken" 
          :mapStyle="mapStyle" 
          :center="center"
          :zoom="zoom"
          @load="onMapLoaded"
        >
          <MglMarker 
          :coordinates="geolocation.geometry.coordinates" 
          :key="index" 
          v-for="(geolocation, index) in geolocations"
          @click="markerClick(geolocation)"
          @mouseenter="makerMouseEnter"
          @mouseleave="makerMouseLeave"
          
          >
            <div class="location-marker" slot="marker"></div>
            <MglPopup
              :closeButton="false"
              :closeOnClick="true"
            >
              <v-card
                class="mx-auto"
                max-width="400"
              >
                <v-img
                  class="white--text align-end"
                  height="200px"
                  :src="geolocation.properties.image"
                >
                  <v-card-title>{{ geolocation.properties.address + ',' + geolocation.properties.city }}</v-card-title>
                </v-img>
                <v-card-subtitle class="pb-0">${{geolocation.properties.price}}</v-card-subtitle>
              </v-card>
            </MglPopup>
          </MglMarker>
      </MglMap>
    </v-col>
  </v-row>
  </v-layout>
</template>

<script>
import Mapbox from "mapbox-gl"
import { MglMap, MglMarker, MglPopup, } from "vue-mapbox"
import axios from 'axios'

import { geoJSON } from './data'

export default {
  name: 'MapBoxView',
  components: {
    MglMap,
    MglMarker,
    MglPopup,
  },
  data() {
    return {
      accessToken: 'pk.eyJ1IjoibXBldGtvdmljeiIsImEiOiJja2MyZmNndmswYnQ0MnVvNXJlN2Ywa2V2In0.yGxGkI0pVzYU3Tn4Z0HCwg', // your access token. Needed if you using Mapbox maps
      mapStyle: 'mapbox://styles/mapbox/streets-v9', // your map style
      features: [],
      geolocations: [],
      center: [-95.7129, 37.0902],
      zoom: 3,

      viewMode: 'streets',
      viewModes: [
        {'value': 'streets', 'text': 'Street View'},
        {'value': 'satellite', 'text': 'Satellite View'},
      ],
      locations: [],
      location: null,
      locationKeyword: '',
      typing: false,
      myTimer: null,
      min: 100000,
      max: 1,
      range: [100000, 1],

    };
  },

  created() {
    // We need to set mapbox-gl library here in order to use it in template
    this.mapbox = Mapbox;
    this.map = null;
  },

  mounted() {   
     this.geolocations = geoJSON.features
     this.features = geoJSON.features
     for(let i = 0; i<this.features.length; i++) {
       if(this.features[i].properties.price > this.max){
         this.max = this.features[i].properties.price
          this.range[1] = this.max
        }
       if(this.features[i].properties.price < this.min){
         this.min = this.features[i].properties.price
         this.range[0] = this.min
       }
     }
  },

  methods: {
    onMapLoaded(event) {
      // in component
      this.map = event.map;
    },
    makerMouseEnter(event) {
      event.marker.togglePopup()
    },
    makerMouseLeave(event) {
      event.marker.togglePopup()
    },
    markerClick(geolocation){
      console.log(geolocation)
    },
    changeViewMode(){
      this.mapStyle="mapbox://styles/mapbox/" + this.viewMode + "-v9"
    },
    changeLocation(event) {
      this.locations = []
      this.typing = false
      this.locationKeyword = ''
    },
    keydownLocation(event) { 
      if(event.keyCode > 31 && event.keyCode < 127 ){
        this.locationKeyword += event.key
      }
      
      clearTimeout(this.myTimer)

      let _self = this
      _self.typing = true

      
      this.myTimer = setTimeout(function(){
        _self.typing = false
      }, 500)      
    },
    applyFilters() {
      this.geolocations = this.features.filter(feature => {
        if(this.location && this.location.text){
          return feature.properties.state == this.location.text
        }
        return true
      })

      this.geolocations = this.geolocations.filter(feature => {
        return feature.properties.price >= this.range[0] && feature.properties.price <= this.range[1]
      })

    },
  },
  watch: {
    typing(val) {      
      if(!val){
        this.locations = []
        const url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + this.locationKeyword + '.json?limit=10&types=region&access_token=' + this.accessToken
        if (this.locationKeyword.length > 0){
          axios.get(url).then(response => {
            // JSON responses are automatically parsed.
            this.locations = response.data.features
          })
          .catch(e => {
            this.errors.push(e)
          })          
        }
        else {
          this.geolocations = this.features
        }
      }
    },
    location(val) {
      this.center = val.center
      this.zoom = 6
      this.applyFilters()
    },
    range(val) {
      this.applyFilters()
    }
  },
};
</script>

<style scoped>
.location-marker {
  transform: translateX(-50%) translateX(126.187px) translateY(-50%) translateY(-395.377px);
  z-index: 0;
  background: rgb(252, 56, 74);

  width: 20px;
  height: 20px;
  line-height: 11px;
  border-radius: 50%;
  border-width: 2px;
  border-style: solid;
  border-color: #fff;
  -webkit-transform: translate(0,2px);
  transform: translate(0,2px);
  box-shadow: 0 2px 2px rgba(0,0,0,.5);
  color: #fff;
  font-size: 10px;
  text-align: center;

  -webkit-box-pack: center;
  justify-content: center;
  -webkit-box-align: center;
  align-items: center;
  cursor: pointer;
}
</style>