import ImageLoad from "@/components/image-load/index.vue";
import Loader from "@/components/loader/index.vue";
import Price from "@/components/barter/item/price/index.vue"
import PhotoSwipe from "photoswipe";
import "photoswipe/style.css";

export default {
	name: "BarterDetails",

	components: {
		ImageLoad,
		Loader,
		Price
	},

	props: {
		item: {
			type: Object,
			default: () => ({})
		}
	},

	data() {
		return {
			hover: 0,
			active: 0,
			addr: {}
		}
	},

	computed: {
		/* Get offer images */
		images() {
			return (this.item.images || []).map(url => this.sdk.manageBastyonImageSrc(url));
		},
		
		/**
		 * Get user location
		 * 
		 * @returns {Array|null}
		 */
		location() {
			const geohash = this.locationStore.geohash;

			this.decodeGeoHash(geohash);
		},

		/**
		 * Decode offer geohash
		 * 
		 * @returns {Array|null}
		 */
		geohash() {
			return this.decodeGeoHash(this.item.geohash);
		},

		/**
		 * Get address from geohash
		 * 
		 * @returns {null|String}
		 */
		geopos() {
			if (!this.addr.country) {
				if (!this.addr.fetching && this.geohash) {
					this.addr.fetching = true;
				
					this.sdk.geoLocation(this.geohash, {
						"zoom": this.zoom || 18,
						"accept-language": this.sdk.getLanguageByLocale(this.$root.$i18n.locale)
					}).then(result => {
						if (result?.address) this.$set(this, "addr", result.address);
					}).catch(e => { 
						console.error(e);
					}).finally(() => {
						this.addr.fetching = false;
					});
				}

				return null;
			} else {
				return [
					this.addr.country,
					this.addr.city || this.addr.town || this.addr.state || this.addr.county
				].filter(f => f).join(", ");
			}
		},

		/**
		 * Calculate distance from geohash to location
		 * 
		 * @returns {Number}
		 */
		distance() {
			const
				R = 6371, /* Radius of the earth in km */
				toRad = (value) => value * Math.PI / 180,
				lat1 = this.location?.[0],
				lon1 = this.location?.[1],
				lat2 = this.geohash?.[0],
				lon2 = this.geohash?.[1],
				destLat = toRad(lat2 - lat1),
				destLon = toRad(lon2 - lon1),
				radLat1 = toRad(lat1),
				radLat2 = toRad(lat2),
				a = Math.sin(destLat / 2) * Math.sin(destLat /2 ) + Math.sin(destLon / 2) * Math.sin(destLon / 2) * Math.cos(radLat1) * Math.cos(radLat2),
				c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

			return parseFloat((R * c).toFixed(1));
		}
	},

	methods: {
		/**
		 * Click on image
		 * 
		 * @param {Number} index
		 */
		imageClick(index) {
			const options = {
				index,
				initialZoomLevel: "fit",
				secondaryZoomLevel: 2,
				maxZoomLevel: 4,
				wheelToZoom: true,
				showHideAnimationType: "fade"
			};

			const promises = this.images.map(item => {
				return new Promise(resolve => {
					let image = new Image();
					image.onload = () => resolve(image);
					image.onerror = () => resolve(image);
					image.src = item;
				})
			});

			Promise.allSettled(promises).then(results => {
				options.dataSource = results
					.map(item => item.value)
					.filter(image => image)
					.map(image => {
						return {
							src:    image.src,
							width:  image.width,
							height: image.height
						}
					});

				const gallery = new PhotoSwipe(options);
				gallery.init();
			}).catch(e => {
				console.error(e);
			});
		}
	}
}