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

	methods: {
		/**
		 * Get absolute path from relative
		 * 
		 * @param {String} relative 
		 * @returns {String}
		 */
		imageUrl(relative) {
			try {
				return require(`@/assets/images/barter/${ relative }`)
			} catch {
				return false;
			}
		},

		/**
		 * Format price to given currency
		 * 
		 * @param {Object} param0
		 * @param {Number} param0.value
		 * @param {String} [param0.locale]
		 * @return {String}
		 */
		formatCurrency({ value, locale }) {
			return (value).toLocaleString(locale ?? "en-US");
		},

		/**
		 * Get categories list from id's array
		 * 
		 * @param {Array} ids
		 * @return {String}
		 */
		getCategories(ids) {
			return ids.map(id => Object.assign(
				this.categories.items[id],
				{ title: this.$t(this.categories.items[id]?.name) }
			));
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