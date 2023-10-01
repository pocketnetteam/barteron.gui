import { GeoHash } from "geohash";
import { OpenStreetMapProvider } from "leaflet-geosearch";

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
			addr: {}
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
				ids = this.sdk.barteron.accounts[this.sdk.address]?.tags || [];
			} else if(ids[0] === "for_nothing") {
				ids = [{ value: this.$t("barterLabels.free") }];
			}

			return this.ifEmpty(
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
		 * Get my location
		 * 
		 * @return {Array}
		 */
		location() {
			const location = Object.values(this.sdk.location);
			return location.length ? location : undefined;
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
		},

		/**
		 * Get address from geohash
		 * 
		 * @return {Object}
		 */
		address() {
			if (!this.addr.country) {
				this.getAddress();
				return null;
			} else {
				return this.addr;
			}
		},

		/**
		 * Calculate distance from geohash to location
		 * 
		 * @return {Number}
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
		 * Check return alternative if empty
		 * 
		 * @return {*}
		 */
		ifEmpty() {
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
		 * Get address from geohash
		 */
		async getAddress() {
			if (this.geohash) {
				/* Send request to provider url */
					const 
				provider = new OpenStreetMapProvider(),
				destination = await fetch(`
					${ provider.reverseUrl }?
					${ new URLSearchParams({
						format: "json",
						lat: this.geohash?.[0],
						lon: this.geohash?.[1],
						zoom: 18,
						addressdetails: 1
					}).toString() }
				`);
			
				/* Parse json response */
				const { address } = await destination.json();
				this.addr = address;
				this.$set(this, "addr", address);
			}
		}
	}
}