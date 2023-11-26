import { GeoHash } from "geohash";
import ImageLoad from "@/components/image-load/index.vue";
import Loader from "@/components/loader/index.vue";

export default {
	name: "BarterItem",

	components: {
		ImageLoad,
		Loader
	},

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
		 * @returns {Array}
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
		 * @returns {Array|null}
		 */
		location() {
			const location = Object.values(this.sdk.location);
			return location.length ? location : undefined;
		},

		/**
		 * Decode offer geohash
		 * 
		 * @returns {Array|null}
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
		 * @returns {Object}
		 */
		address() {
			if (!this.addr.country) {
				if (!this.addr.fetching && this.geohash) {
					this.addr.fetching = true;
				
					this.sdk.geoLocation(this.geohash)
						.then(result => {
							this.$set(this, "addr", result.address);
						});
				}

				return null;
			} else {
				return [
					this.address.country,
					this.address.city || this.address.town || this.address.county
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
		 * Check return alternative if empty
		 * 
		 * @returns {*}
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
			if (["http", "data:image"].some(str => path?.startsWith(str))) {
				return path;
			} else {
				try {
					return require(`@/assets/images/barter/${ path }`)
				} catch {
					return null;
				}
			}
		},

		imageZoom(e) {
			const
				picture = this.$refs.picture,
				holder = picture.querySelector("li.active"),
				image = holder?.querySelector("img");

			if (!image?.src) return;

			if (e.type !== "mouseleave") {
				holder.classList.add("zoom");
				holder.style.setProperty("--url", `url(${ image.src })`);

				/* Move */
				const
					rect = e.target.getBoundingClientRect(),
					xPos = e.clientX - rect.left,
					yPos = e.clientY - rect.top,
					xPercent = `${ xPos / (holder.clientWidth / 100) }%`,
					yPercent = `${ yPos / (holder.clientHeight / 100) }%`;
 
				Object.assign(holder.style, {
					backgroundPosition: `${ xPercent } ${ yPercent }`,
					backgroundSize: `${ (image.offsetWidth / 100) * 120 }px`
				});
			} else if(e.type === "mouseleave") {
				holder.classList.remove("zoom");
				holder.removeAttribute("style");
			}
		}
	}
}