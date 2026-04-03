import Vue from "vue";
import Loader from "@/components/loader/index.vue";
import Offer from "./offer.vue";
import banProcessor from "@/js/banUtils.js";

export default {
	name: "Content",

	components: {
		Loader,
		Offer,
	},

	data() {
		return {
			isChatLoading: false,
			isLoading: false,
			deals: [],
		}
	},

	inject: ["dialog"],

	methods: {
		async loadDeals() {

			this.isLoading = true;
			this.deals = [];

			try {
				const
					sdk = Vue.prototype.sdk,
					source = await sdk.getBrtOffersByHashes([this.$route.query?.source]).then(result => result?.pop()),
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

				this.deals = (dealsResult || []).filter(f => 
					!(f?.address && banProcessor.isBannedAddress(f.address) 
						|| f?.source?.address && banProcessor.isBannedAddress(f.source.address)
						|| f?.target?.address && banProcessor.isBannedAddress(f.target.address)
					)
				);
			} catch (e) {
				console.error(e);
			} finally {
				this.isLoading = false;
			};
		},

		/**
		 * Propose exchange your offer to sellers' offers
		 * 
		 * @param {@ComplexDeal} deal
		 */
		proposeExchange(deal) {
			this.createRoom(deal);
		},

		/**
		 * Create room and send message
		 * 
		 * @param {@ComplexDeal} deal
		 */
		createRoom(deal) {
			if (this.sdk.willOpenRegistration()) return;

			this.isChatLoading = true;
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
				this.isChatLoading = false;
			});
		},
	},

	mounted() {
		this.loadDeals();
	},

	async beforeRouteUpdate(to, from, next) {
		const needUpdate = (JSON.stringify(to.query) !== JSON.stringify(from.query));
		if (needUpdate) {
			this.loadDeals();
		};
		next();
	},
}