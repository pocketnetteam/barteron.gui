export default {
	name: "Location",

	data() {
		return {
			lightbox: false
		}
	},

	methods: {
		showLightbox() {
			this.lightbox = true;
		},

		hideLightbox() {
			this.lightbox = false;
		}
	},
}