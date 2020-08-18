import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import * as VueGoogleMaps from 'vue2-google-maps'
import 'mapbox-gl/dist/mapbox-gl.css'

Vue.config.productionTip = false

Vue.use(VueGoogleMaps, {
  load: {
    key: 'AIzaSyAJQfT7fSPHHoGVC3fuxV_qH4U1Rsunp8o',
    libraries: 'places',
  },
})

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
