import BarterExchange from "@/components/barter/exchange/index.vue";
import Profile from "@/components/profile/index.vue";
import ExchangeList from "@/components/barter/exchange/list/index.vue";
import CurrencySwitcher from "@/components/currency-switcher/index.vue";

export default {
	name: "Sidebar",

	components: {
		BarterExchange,
		Profile,
		ExchangeList,
		CurrencySwitcher
	},

	data() {
		return {
			myOffers: []
		}
	},

	inject: ["dialog"],

	computed: {
		/**
		 * Getting preview flag
		 * 
		 * @returns {Boolean}
		 */
		isPreview() {
			return this.$route.query.preview && this.isMyOffer;
		},

		/**
		 * Get offer data
		 * 
		 * @returns {@Offer}
		 */
		item() {
			return (Number.isInteger(this.$route.params.id) ? this.barters.items : this.sdk.barteron.offers)[this.$route.params.id];
		},

		/**
		 * Get author address
		 * 
		 * @returns {String}
		 */
		address() {
			return this.item?.address;
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
		 * Get author account
		 * 
		 * @returns {@Account}
		 */
		account() {
			return this.sdk.barteron.accounts[this.address];
		}
	},

	methods: {
		/**
		 * Create room and send message
		 * 
		 * @param {@Offer} offer
		 */
		createRoom(offer) {
			this.sendMessage({
				name: offer.caption,
				members: [this.address],
				messages: [this.sdk.appLink(`barter/${ offer.hash }`)],
				openRoom: true
			});
		},

		/**
		 * Withdraw of Remove an Offer Dialog
		 * 
		 * @param {@Offer} offer
		 * @param {Boolean} remove
		 */
		withdrawOrRemoveEvent(offer, remove = false) {
			this.dialog?.instance
				.view("question", this.$t(`dialogLabels.offer_${ remove ? 'delete' : 'withdraw' }`))
				.then(state => {
					if (state) {
						this.withdrawOrRemove(offer, remove);
					}
				});
		},

		/**
		 * Withdraw of Remove an Offer
		 * 
		 * @param {@Offer} offer
		 * @param {Boolean} remove
		 */
		withdrawOrRemove(offer, remove = false) {
			if (!remove) {
				this.dialog?.instance.view("load", this.$t("dialogLabels.data_node"));
		
				offer.set({
					published: 0
				}).then((data) => {
					if (data.transaction) {
						this.dialog?.instance.hide();
						this.natigateToProfile();
					} else {
						this.showError(this.$t("dialogLabels.node_error"));
					}
				}).catch(e => {
					this.showError(e);
				});
			}
		},

		/**
		 * Navigate to profile
		 */
		natigateToProfile() {
			this.$router.replace({
				path: `/profile/${ this.sdk.address }`,
				hash: `#ads`
			}).catch(e => {
				this.showError(e);
			});
		},

		/**
		 * Show error
		 * 
		 * @param {Object} e
		 */
		showError(e) {
			this.dialog?.instance.view("error", e);
		}
	},

	async mounted() {
		this.myOffers = await this.sdk.getBrtOffers();
	}
}