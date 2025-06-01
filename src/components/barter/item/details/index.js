import ImageLoad from "@/components/image-load/index.vue";
import Loader from "@/components/loader/index.vue";
import VideoPreview from "@/components/video-preview/index.vue";
import Price from "@/components/barter/item/price/index.vue"
import WorkSchedule from "@/components/work-schedule/index.vue";
import { showMediaItems } from "@/js/mediaUtils.js";
import "photoswipe/style.css";
import Vue from 'vue';

export default {
	name: "BarterDetails",

	components: {
		ImageLoad,
		Loader,
		VideoPreview,
		Price,
		WorkSchedule
	},

	props: {
		item: {
			type: Object,
			default: () => ({})
		}
	},

	data() {
		return {
			videoItem: null,
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

		mediaItems() {
			const imageItems = (this.images || []).map(m => ({
				url: m,
				type: "image",
			}));

			let result = imageItems;

			this.setVideoItem();

			if (this.videoItem) {
				const order = this.item.videoSettings?.order;
				if (order === "last") {
					result = [...imageItems, this.videoItem];
				} else {
					result = [this.videoItem, ...imageItems];
				};
			};

			return result;
		},

		/**
		 * Get pickup point data
		 * 
		 * @returns {Object}
		 */
		pickupPoint() {
			return this.item.delivery?.pickupPoint;
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
		setVideoItem() {
			if (!(this.videoItem)) {
				const url = this.item.video;
				if (url) {
					Vue.set(this, "videoItem", {
						url: url,
						type: "video",
						data: null,
						error: null,
					});

					this.sdk.getVideoInfo([url]).then(dataItems => {
						Vue.set(this.videoItem, "data", dataItems?.[0]);
					}).catch(e => {
						Vue.set(this.videoItem, "error", e);
						console.error(e);
					});
				};
			};
		},

		/**
		 * Click on media item
		 * 
		 * @param {Number} index
		 */
		mediaItemClick(index) {
			showMediaItems(this.mediaItems, index);
		},
	}
}