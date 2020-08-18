<template>
<v-layout ma-1 row wrap>  
  <v-row>
      <v-col cols="12">
      <v-card class="pl-4 pr-4">
        <v-row>
          <v-col  cols="12" xs="12" sm="4" md="4">
            <v-select
              label="View Mode"
              :items="viewModes"
              v-model="viewMode"
              item-value="value"
              item-text="text"
              @change="changeViewMode"
            ></v-select>
          </v-col>
          <v-col cols="0" sm="2" md="4">      
          </v-col>
          <v-col cols="12" xs="12" sm="6" md="4">
            <v-card outlined class="pl-4 pr-4">
            <v-card-title>Filters</v-card-title>
              <v-divider></v-divider>

              <v-row>
                <v-col cols="12">
                  <v-select
                      label="Select a State in USA"
                      :items="US_States"
                      v-model="state"
                      item-text="place_name"
                      
                      @change="changeLocation"
                      @keydown="keydownLocation"
                    >            
                    </v-select>
                </v-col>
                <v-col cols="12">
                  <v-row>
                  <v-col cols="6">
                  <v-text-field
                    label="Min Price"
                    :value="range[0]"
                    prefix="$"
                    suffix="K"
                    class="mt-0 pt-0"
                    type="number"
                    align="right"
                    @change="$set(range, 0, $event)"
                  ></v-text-field>
                  </v-col>
                  <v-col cols="6">
                  <v-text-field
                    label="Max Price"
                    :value="range[1]"
                    prefix="$"
                    suffix="K"
                    class="mt-0 pt-0"
                    type="number"
                    @change="$set(range, 1, $event)"
                  ></v-text-field>
                  </v-col>
                </v-row>
                  <v-range-slider
                    v-model="range"
                    :max="max"
                    :min="min"
                    hide-details
                    style="display: none;"
                    class="align-center"
                  >
                    <template v-slot:prepend>                    
                    </template>
                    <template v-slot:append>                    
                    </template>
                  </v-range-slider>
                </v-col>
              </v-row>  
            </v-card>        
        </v-col>
        </v-row>
        </v-card>
      </v-col>
      <v-col cols="12" style="height: 65%;">
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
            >
              <v-card
                max-width="128"
              >
                <v-img
                  class="white--text align-end"
                  height="100px"
                  :src="geolocation.properties.image"
                >
                </v-img>
                <v-card-subtitle class="pb-0">Price: ${{geolocation.properties.price}}K</v-card-subtitle>
              </v-card>
            </MglPopup>
          </MglMarker>
      </MglMap>

      <v-dialog
        v-model="dialog"
        max-width="600"
      >
        <v-card>
          <v-card-title class="headline">{{ locationString }}</v-card-title>

            <v-carousel>
              <v-carousel-item
                v-for="(item,i) in locationImages"
                :key="i"
                :src="item"
                reverse-transition="fade-transition"
                transition="fade-transition"
              ></v-carousel-item>
            </v-carousel>

          <v-card-text>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn
              color="green darken-1"
              text
              @click="dialog = false"
            >
              Close
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </v-col>
  </v-row>
  </v-layout>
</template>

<script>
import Mapbox from "mapbox-gl"
import { MglMap, MglMarker, MglPopup, } from "vue-mapbox"
import axios from 'axios'

import { geoJSON } from './data'
import { USStates } from './USStates'

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
      marker: null,
      
      dialog: false,
      viewMode: 'streets',
      viewModes: [
        {'value': 'streets', 'text': 'Street View'},
        {'value': 'satellite', 'text': 'Satellite View'},
      ],
      US_States: [],
      state: '',
      location: null,
      locationKeyword: '',
      typing: false,
      myTimer: null,
      min: 100000,
      max: 1,
      range: [100000, 1],
      locationData: null,
      locationString: '',
      locationImages: [],
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

     this.US_States = USStates.map(state => state.name)     
  },

  methods: {
    onMapLoaded(event) {
      // in component
      this.map = event.map;
    },
    makerMouseEnter(event) {
      event.marker.togglePopup()
      this.marker = event.marker
    },
    makerMouseLeave(event) {
      event.marker.togglePopup()
      this.marker = event.marker
    },
    markerClick(geolocation){
      this.marker.togglePopup()
      this.locationData = geolocation
      this.locationString = geolocation.properties.address + ', ' + geolocation.properties.city + ', ' + geolocation.properties.state
      this.locationImages = [
        'https://photos.zillowstatic.com/cc_ft_576/ISb13kddfh2v051000000000.jpg',
        'https://photos.zillowstatic.com/cc_ft_576/IS3v08v6b9ux051000000000.jpg',
        'https://photos.zillowstatic.com/cc_ft_576/ISvoyvc071m0151000000000.jpg',
        'https://photos.zillowstatic.com/cc_ft_576/ISvg0ki77ed9g51000000000.jpg',
        'https://photos.zillowstatic.com/cc_ft_576/ISrtn7t3mwge151000000000.jpg'
      ]
      this.dialog = true
    },
    changeViewMode(){
      this.mapStyle="mapbox://styles/mapbox/" + this.viewMode + "-v9"
    },
    changeLocation() {        
        const url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + this.state + '.json?limit=10&types=region&access_token=' + this.accessToken
        axios.get(url).then(response => {
          // JSON responses are automatically parsed.
          this.location = response.data.features[0]

          const options = {
            center: this.location.center,
            zoom: 8
          }
          this.map.flyTo(options)
          
          this.applyFilters()
        })
        .catch(e => {
          this.errors.push(e)
        })          
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
    },
    location(val) {      
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

.mapboxgl-popup-content {
  padding: 0;
}
</style>