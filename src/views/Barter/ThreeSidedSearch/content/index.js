import Vue from "vue";
import Offer from "./offer.vue";

export default {
	name: "Content",

	components: {
		Offer
	},

	data() {
		return {
			isLoading: false,
			deals: []
		}
	},

	inject: ["dialog"],

	methods: {
		/**
		 * Propose exchange your offer to sellers' offers
		 * 
		 * @param {@ComplexDeal} deal
		 */
		proposeExchange(deal) {
			this.dialog?.instance
				.view("question", this.$t("dialogLabels.contact_sellers"))
				.then(state => {
					if (state) {
						this.createRoom(deal);
					}
				});
		},

		/**
		 * Create room and send message
		 * 
		 * @param {@ComplexDeal} deal
		 */
		createRoom(deal) {
			if (this.sdk.willOpenRegistration()) return;

			this.isLoading = true;
			this.dialog?.instance.view("load", this.$t("dialogLabels.opening_room"));
			this.sendMessage({
				name: this.$t("buttonLabels.group_exchange"),
				members: [deal.address, deal.target.address],
				messages: [this.sdk.appLink(`barter/search?source=${ deal.source.hash }&target=${ deal.target.hash }`)],
				openRoom: true
			}).then(() => {
				this.dialog?.instance.hide();
			}).catch(e => {
				this.showError(e);
			}).finally(() => {
				this.isLoading = false;
			});
		}
	},

	async beforeRouteEnter (to, from, next) {

		let deals = [];

		try {

		const
			sdk = Vue.prototype.sdk,
			source = await sdk.getBrtOffersByHashes([to.query?.source]).then(result => result?.pop()),
			dealsResult = await sdk.getBrtOfferComplexDeals({
				myTag: source?.tag,
				theirTags: await sdk.getTheirTags(source),
				excludeAddresses: [source?.address]
			}).then(offers => {
				return offers?.reduce((result, match) => {
					if (match?.intermediates) {
						match.intermediates.forEach(offer => {
							offer.update({ source, target: match.target });
							result.push(offer);
						});
					}
	
					return result;
				}, []);
			});

			deals = dealsResult;

		} catch (e) {
			console.error(e);
		}

		/* Pass data to instance */
		next(vm => {
			vm.deals = deals;
		});
	}
}