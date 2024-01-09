import BarterExchange from "@/components/barter/exchange/index.vue";
import Profile from "@/components/profile/index.vue";
import ExchangeList from "@/components/barter/exchange/list/index.vue";

export default {
	name: "Sidebar",

	components: {
		BarterExchange,
		Profile,
		ExchangeList
	},

	data() {
		return {
			myOffers: []
		}
	},

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
			this.sdk.createRoom({
				name: this.item.caption,
				members: [this.address]
			}).then(chat => {
				this.sdk.sendMessage({
					...chat,
					message: `https://${ this.manifest.scope }/barter/${ offer.hash }`
				});
			});
		}
	},

	async mounted() {
		this.myOffers = await this.sdk.getBrtOffers();
	}
}