import SelectOfferDialog from "@/views/Barter/SelectOfferDialog/index.vue";
import Vue from 'vue';

export default {
	name: "BarterExchange",

	components: {
		SelectOfferDialog,
	},

	props: {
		item: Object,
	},

	data() {
		return {
			selected: null,
			items: [],
			isLoading: false,
			// groupExchange: []
		}
	},

	inject: ['dialog', 'lightboxContainer'],

	computed: {
		/**
		 * Get author address
		 * 
		 * @returns {String}
		 */
		address() {
			return this.item?.address;
		}
	},

	methods: {
		/**
		 * Create room and send message
		 * 
		 * @param {Offer} offer
		 */
		createRoom(offer) {
			if (this.sdk.willOpenRegistration()) return;
			const
				/** @type {Object|undefined} */
				delivery = this.sdk.barteron.offers[offer.hash]?.deliveryPoint;
			
			this.isLoading = true;
			this.dialog?.instance.view("load", this.$t("dialogLabels.opening_room"));
			this.sendMessage({
				name: offer.caption,
				members: [this.address, delivery?.address].filter(f => f),
				messages: [this.sdk.appLink(`barter/${ offer.hash }`)],
				openRoom: true
			}).then(() => {
				this.dialog?.instance.hide();
			}).catch(e => {
				this.showError(e);
			}).finally(() => {
				this.isLoading = false;
			});
		},

		/**
		 * Select your offer to propose exchange seller's offer
		 */
		selectOffer() {
			var ComponentClass = Vue.extend(SelectOfferDialog);
			var instance = new ComponentClass({
				propsData: {
					item: this.item,
					items: this.items,
				}
			});
			
			instance.$on('onSelect', vm => {
				this.selected = vm.selected;
				this.proposeExchange();
			});

			instance.$mount();
			this.lightboxContainer().appendChild(instance.$el);
			instance.show();
		},

		/**
		 * Propose exchange your offer to seller's offer
		 */
		proposeExchange() {
			this.createRoom(this.items[this.selected]);
		},

		/**
		 * Contact seller
		 */
		contactSeller() {
			this.createRoom(this.item, this.item.deliveryPoint);
		}
	},

	async mounted() {
		/* this.groupExchange = await this.sdk.getBrtOfferDeals({
			offer: this.item.hash,
			address: this.sdk.address
		}); */

		try {
			this.items = await this.sdk.getBrtOffers();
		} catch (e) {
			console.error(e);
		}
	}
}