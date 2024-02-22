import { GeoHash } from "geohash";
import ImageLoad from "@/components/image-load/index.vue";
import Loader from "@/components/loader/index.vue";
import ExchangeList from "@/components/barter/exchange/list/index.vue";
import LikeStore from "@/stores/like.js";

export default {
	name: "BarterItem",

	components: {
		ImageLoad,
		Loader,
		ExchangeList
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
		},
		customLink: {
			type: [String, Object, Function],
			default: null
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
		 * Get owner account
		 * 
		 * @returns {@Account}
		 */
		ownerAccount() {
			return this.sdk.barteron.accounts[this.item.address];
		},
		
		/**
		 * Get exchange list
		 * 
		 * @returns {Array}
		 */
		exchangeList() {
			let ids = this.item.tags;

			if (ids.includes("my_list")) {
				ids = this.ownerAccount?.tags || [];
			} else if (ids.includes("for_nothing")) {
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
				[{ value: this.$t("buttonLabels.unknown") }]
			);
		},

		/**
		 * Get user location
		 * 
		 * @returns {Array|null}
		 */
		location() {
			const geohash = this.account?.geohash;

			if (geohash) {
				const { latitude, longitude } = GeoHash.decodeGeoHash(geohash);
				return [latitude[0], longitude[0]];
			} else {
				return null;
			}
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
		 * @returns {null|String}
		 */
		geopos() {
			if (!this.addr.country) {
				if (!this.addr.fetching && this.geohash) {
					this.addr.fetching = true;
				
					this.sdk.geoLocation(this.geohash)
						.then(result => {
							if (result?.address) this.$set(this, "addr", result.address);
						});
				}

				return null;
			} else {
				return [
					this.addr.country,
					this.addr.city || this.addr.town || this.addr.county
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
		},

		/**
		 * Customize offer link
		 * 
		 * @returns {Object|String}
		 */
		offerLink() {
			if (!this.customLink) {
				return { name: 'barterItem', params: { id: this.item.hash } };
			} else if (typeof this.customLink === "function") {
				return this.customLink(this.item, this);
			} else {
				return this.customLink;
			}
		},

		/**
		 * Get like state
		 * 
		 * @returns {Boolean}
		 */
		hasLike() {
			return LikeStore.hasLike(this.item?.hash);
		}
	},

	methods: {
		/**
		 * Set like state
		 */
		setLike() {
			LikeStore.set(this.item?.hash);
		},

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