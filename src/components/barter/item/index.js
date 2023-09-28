import { GeoHash } from "geohash";

export default {
	name: "BarterItem",

	props: {
		item: {
			type: Object,
			default: () => ({})
		},
		vType: {
			/* row, tile or item */
			type: String,
			default: "tile"
		}
	},

	data() {
		return {
			hover: 0,
			active: 0,
			distances: {}
		}
	},

	computed: {
		/**
		 * Get exchange list
		 * 
		 * @return {Array}
		 */
		exchangeList() {
			let ids = this.item.tags;

			if (ids[0] === "my_list") {
				ids = this.sdk.barteron.account[this.sdk.address].tags;
			} else if(ids[0] === "for_nothing") {
				ids = [{ value: this.$t("barterLabels.free") }];
			}

			return this.isEmpty(
				/* Values */
				ids?.map(id => {
					const category = this.categories.items[id];
	
					return {
						...category,
						value: this.$t(category?.name)
					}
				}).filter(c => c.id),

				/* Alternative */
				[{ value: this.$t("barterLabels.unknown") }]
			);
		},

		/**
		 * Decode offer geohash
		 * 
		 * @return {Array}
		 */
		geohash() {
			if (this.item.geohash) {
				const { latitude, longitude } = GeoHash.decodeGeoHash(this.item.geohash);
				return [latitude[0], longitude[0]];
			} else {
				return null;
			}
		}
	},

	methods: {
		/**
		 * Check return alternative if empty
		 * 
		 * @return {*}
		 */
		isEmpty() {
			for (let a in arguments) {
				const prop = arguments[a];
				if (prop?.length) return prop;
			}

			return arguments[arguments.length - 1];
		},

		/**
		 * Get absolute path from path
		 * 
		 * @param {String} path
		 * 
		 * @returns {String}
		 */
		imageUrl(path) {
			if (path.startsWith("http")) {
				return path;
			} else {
				try {
					return require(`@/assets/images/barter/${ path }`)
				} catch {
					return null;
				}
			}
		},

		/**
		 * Calculate item distance to you
		 * 
		 * @param {Object} item
		 */
		calcDistance(item) {
			if (navigator.geolocation && Array.isArray(item.location)) {
				navigator.geolocation.getCurrentPosition(
					/* Success */
					(pos) => {
						const
							R = 6371, /* Radius of the earth in km */
							toRad = (value) => value * Math.PI / 180,
							lat1 = pos.coords.latitude,
							lon1 = pos.coords.longitude,
							lat2 = item.location[0],
							lon2 = item.location[1],
							destLat = toRad(lat2 - lat1),
							destLon = toRad(lon2 - lon1),
							radLat1 = toRad(lat1),
							radLat2 = toRad(lat2),
							a = Math.sin(destLat / 2) * Math.sin(destLat /2 ) + Math.sin(destLon / 2) * Math.sin(destLon / 2) * Math.cos(radLat1) * Math.cos(radLat2),
							c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	
						this.$set(this.distances, item.id, parseFloat((R * c).toFixed(1)));
					}
				);

				return true;
			} else {
				return false;
			}
		}
	}
}