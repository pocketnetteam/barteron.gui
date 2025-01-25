import PopularList from "@/components/categories/popular-list/index.vue";
import BarterList from "@/components/barter/list/index.vue";
import Banner from "@/components/banner/index.vue";
import viewedStore from "@/stores/viewed.js";

export default {
	name: "Home",

	components: {
		PopularList,
		BarterList,
		Banner
	},

	data() {
		return {
			mayMatchExchanges: [],
			viewedList: [],
			needForceUpdate: false,
		}
	},

	methods: {
		/**
		 * Get complex deals
		 */
		async getComplexDeals() {
			if (this.address?.length) {
				/* Get my offers list */
				const myOffers = await this.sdk.getBrtOffers(this.address)
					.then(offers => offers.filter(offer => offer.active))
					.catch(e => console.error(e));
	
				/* Get potential exchange offers */
				if (myOffers?.length) {
					this.mayMatchExchanges = await Promise.all(
						myOffers.map(async offer => {
							return this.sdk.getBrtOfferComplexDeals({
								location: this.getStoredLocation() || [],
								myTag: offer.tag,
								theirTags: await this.sdk.getTheirTags(offer),
								excludeAddresses: [this.address]
							}).then(offers => {
								if (offers?.[0]?.target) {
									return offers[0].target.update({ source: offer })
								} else {
									return null;
								}
							});
						})
					).then(results => {
						return results.filter(result => result);
					}).catch(e => { 
						console.error(e);
					});
				}
			}
		},

		/**
		 * Get viewed list
		 */
		async getViewed(options = {fullUpdate: false}) {
			const 
				storedHashes = viewedStore.viewed || [],
				currentOffers = (options?.fullUpdate ? [] : this.viewedList),
				currentHashes = currentOffers.map(item => item?.hash).filter(f => f),
				newHashes = storedHashes.filter(f => !(currentHashes.includes(f)));
			
			let
				newOffers = [],
				requestError = null;

			if (newHashes.length) {
				try {
					newOffers = await this.sdk.getBrtOffersByHashes(newHashes);
				} catch (e) {
					requestError = e;
					console.error(e);
				};
			}

			if (!(requestError)) {
				const
					allOffers = currentOffers.concat(newOffers),
					allHashes = allOffers.map(item => item?.hash).filter(f => f),
					filteredHashes = storedHashes.filter(f => allHashes.includes(f)),
					needUpdateStore = (JSON.stringify(storedHashes) !== JSON.stringify(filteredHashes));

				if (needUpdateStore) {
					viewedStore.updateInPatchMode(filteredHashes);
				};

				const newViewedList = filteredHashes.map(hash => allOffers.filter(f => f.hash === hash).pop());

				// to avoid re-render bug for images we change viewedList twice
				// we left first item in list to prevent disappear viewedList
				// and then in setTimeout we put all items to viewedList
				this.viewedList = newViewedList.slice(0,1);
				setTimeout(() => {
					this.viewedList = newViewedList;
				});
			}
		},
	},

	watch: {
		"locationStore.bounds"() {
			this.getComplexDeals();
		},

		"offerChanges.offerUpdateActionId"() {
			this.needForceUpdate = true;
		}
	},

	mounted() {
		this.getComplexDeals();
		this.getViewed();
	},

	activated() {
		if (this.needForceUpdate) {
			this.getComplexDeals();
		};
		this.getViewed({fullUpdate: this.needForceUpdate});
		this.needForceUpdate = false;
	},
}