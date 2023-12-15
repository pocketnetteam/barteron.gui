import Vue from "vue";
import NameToHSL from "@/js/nametohsl.js";

export default {
	name: "Content",

	data() {
		return {
			color: new NameToHSL(),
			source: {},
			target: {},
			deals: []
		}
	},

	computed: {
		/**
		 * Get source user
		 * 
		 * @returns {Object}
		 */
		sourceUser() {
			return this.getUserData(this.source.address);
		},

		/**
		 * Get target user
		 * 
		 * @returns {Object}
		 */
		targetUser() {
			return this.getUserData(this.target.address);
		}
	},

	methods: {
		getUserData(address) {
			const user = this.sdk.accounts[address];

			return {
				address,
				i: user?.i,
				name: user?.name,
				shortName: user?.name?.substring(0, 1).toUpperCase() || "U",
				hslColor: `--color: ${ this.color.generateHSL(user?.name || "User") }`
			}
		}
	},

	async beforeRouteEnter (to, from, next) {
		const
			sdk = Vue.prototype.sdk,
			offers = await sdk.getBrtOffersByHashes([to.query?.source, to.query?.target]),
			deals = await sdk.getBrtOfferComplexDeals({
				myTags: [offers[0]?.tag],
				theirTags: [offers[1]?.tag],
				excludeAddresses: [offers[0]?.address]
			});

		/* Pass data to instance */
		next(vm => {
			vm.deals = deals;
			vm.source = offers[0];
			vm.target = offers[1];
		});
	}
}