import './polyfills'

import Carousel from './Carousel/Carousel.vue'
import Slide from './Slide/Slide.vue'

const install = Vue => {
  Vue.component('Carousel', Carousel)
  Vue.component('Slide', Slide)
}

export default {
  install
}

export { Carousel, Slide }
