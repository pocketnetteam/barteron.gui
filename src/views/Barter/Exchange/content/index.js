import Vue from "vue";
import BarterList from "@/components/barter/list/index.vue";
import {
	default as profileStore,
} from "@/stores/profile.js";

export default {
	name: "Content",

	components: {
		BarterList
	},

	data() {
		return {
			isLoading: false,
			deals: [],
			appBannerDisabled: false,
		}
	},

	inject: ["dialog"],

	computed: {
		appsLink() {
			return "https://bastyon.com/applications";
		},

		/**
		 * Get offer by id
		 * 
		 * @returns {@Offer}
		 */
		offer() {
			return this.sdk.barteron.offers[this.$route.params.id];
		},

		/**
		 * Get expanded state
		 * 
		 * @returns {Boolean}
		 */
		expanded() {
			return !!this.$route.query.expanded;
		}
	},

	methods: {
		/**
		 * Show exchange options
		 */
		expand() {
			this.$router.replace({ query: { expanded: 1 } }).catch(e => {
				console.error(e);
			});
		},

		/**
		 * Propose exchange your offer to seller's offer
		 * 
		 * @param {@Offer} offer
		 */
		proposeExchange(offer) {
			this.createRoom(offer);
		},

		/**
		 * Create room and send message
		 * 
		 * @param {@Offer} offer
		 */
		createRoom(offer) {
			if (this.sdk.willOpenRegistration()) return;
			
			this.isLoading = true;
			this.dialog?.instance.view("load", this.$t("dialogLabels.opening_room"));
			this.sendMessage({
				name: this.offer.caption,
				members: [offer.address],
				messages: [this.sdk.appLink(`barter/${ this.offer.hash }`)],
				openRoom: true
			}).then(() => {
				this.dialog?.instance.hide();
			}).catch(e => {
				this.showError(e);
			}).finally(() => {
				this.isLoading = false;
			});
		},

		openAppsLink() {
			this.sdk.openExternalLink(this.appsLink);
		},

		appBannerDisabledChange(value, e) {
			profileStore.appBannerDisabled = e.target.checked;
			profileStore.saveState();
		},

		hideAppBanner() {
			this.appBannerDisabled = true;
		},
	},

	async beforeRouteEnter (to, from, next) {
		const
			hash = to.params?.id,
			sdk = Vue.prototype.sdk;
		
		let
			deals = [],
			offer = sdk.barteron.offers[hash];
		
		const isLoaded = (offer) => (offer && offer?.tag);

		if (!(isLoaded(offer))) {
			try {
				offer = await sdk.getBrtOffersByHashes([hash]).then(result => result?.pop());
			} catch (e) {
				console.error(e);
			}
		}

		if (isLoaded(offer)) {
			try {
				deals = await sdk.getBrtOfferDeals({
					pageSize: 100, // TODO: add pagination to this page change pageSize to 10
					myTags: [offer?.tag],
					theirTags: await sdk.getTheirTags(offer),
					excludeAddresses: [offer?.address]
				});				
			} catch (e) {
				console.error(e);
			}
		}

		/* Pass data to instance */
		next(vm => vm.deals = deals);
	},

	mounted() {
		profileStore.setAddress(this.sdk.address);
		this.appBannerDisabled = profileStore.appBannerDisabled;
	},
}