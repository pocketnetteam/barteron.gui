import Vue from "vue";
import ImageLoad from "@/components/image-load/index.vue";
import Loader from "@/components/loader/index.vue";
import Caption from "@/components/barter/item/caption/index.vue";
import PhotoSwipe from "photoswipe";
import SelectPickupPointDialog from "@/components/pickup-point/select-dialog/index.vue";
import "photoswipe/style.css";

export default {
	name: "PickupPointItem",

	components: {
		ImageLoad,
		Loader,
		Caption,
		SelectPickupPointDialog,
	},

	inject: ['dialog', 'lightboxContainer'],
	
	props: {
		item: {
			type: Object,
			default: () => ({})
		},
		isSelfPickup: {
			type: Boolean,
			default: false
		}
	},

	data() {
		return {
			hover: 0,
			active: 0,
		}
	},

	computed: {
		/**
		 * Get author address
		 * 
		 * @returns {String}
		 */
		address() {
			return this.item.address;
		},

		/**
		 * Show is this offer is owner's
		 * 
		 * @returns {Boolean}
		 */
		isMyOffer() {
			return this.address === this.sdk.address;
		},

		/**
		 * Get owner account
		 * 
		 * @returns {@Account}
		 */
		ownerAccount() {
			return this.sdk.barteron.accounts[this.address];
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
		 * Decode offer geohash
		 * 
		 * @returns {Array|null}
		 */
		geohash() {
			return this.decodeGeoHash(this.item.geohash);
		},

		/* Get offer images */
		images() {
			return (this.item.images || []).map(url => this.sdk.manageBastyonImageSrc(url));
		},

		/**
		 * Show is offer has published
		 * 
		 * @returns {Boolean}
		 */
		hasRelay() {
			return this.item.relay;
		},

		/**
		 * Checking removed status
		 * 
		 * @returns {Boolean}
		 */
		isRemoved() {
			return this.item.status === "removed";
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
		},

		showItem() {
			var ComponentClass = Vue.extend(SelectPickupPointDialog);
			var instance = new ComponentClass({
				propsData: {
					item: this.item,
				},
			});
			
			instance.$on('onSelect', vm => {
				this.selectItem();
			});

			instance.$mount();
			this.lightboxContainer().appendChild(instance.$el);
			this.$nextTick(() => {
				instance.show();
			});
		},

		selectItem() {
			this.$emit("selectItem", this);
		},
	},
}