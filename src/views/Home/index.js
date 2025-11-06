import CategoriesPreview from "@/components/categories/preview/index.vue";
import PopularList from "@/components/categories/popular-list/index.vue";
import BarterList from "@/components/barter/list/index.vue";
import LegalInfo from "@/components/legal-info/index.vue";
import Banner from "@/components/banner/index.vue";
import viewedStore from "@/stores/viewed.js";
import banProcessor from "@/js/banUtils.js";

export default {
	name: "Home",

	components: {
		CategoriesPreview,
		PopularList,
		BarterList,
		LegalInfo,
		Banner
	},

	data() {
		return {
			mayMatchExchanges: [],
			viewedList: [],
			needForceUpdate: false,
		}
	},

	computed: {
		requiredLegalInfoItemKeys() {
			return [
				"user_agreement", 
				"personal_data_processing_policy"
			];
		},

		legalInfoAvailable() {
			const
				isHomePage = (this.$route.name === "home"),
				locale = this.$root.$i18n.locale,
				data = (isHomePage && LegalInfo.methods.allDocumentsWithoutContext?.()) || {},
				existingKeys = (data[locale] || []).map(m => m.i18nKey);

			return this.requiredLegalInfoItemKeys.some(f => existingKeys.includes(f));
		},
	},

	methods: {
		// TODO: remove this method
		async getComplexDeals_Deprecated() {
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
		 * Get complex deals
		 */
		async getComplexDeals() {
			if (!(this.address?.length)) {
				return;
			};

			const myAccount = await this.sdk.getBrtAccount(this.address)
				.then(accounts => accounts?.[0])
				.catch(e => console.error(e));

			if (!(myAccount)) {
				return;
			};

			const myOffers = await this.sdk.getBrtOffers(this.address)
				.then(offers => offers.filter(offer => offer.active))
				.catch(e => console.error(e));

			const allTags = await Promise.all(
				myOffers.map(async offer => {
					const theirTags = await this.sdk.getTheirTags(offer, { account: myAccount });
					return {
						offer,
						myTag: offer.tag,
						theirTags,
					};
				})
			).catch(e => { 
				console.error(e);
			});

			const groupedTags = [];
			allTags.forEach(item => {
				const groupedItem = groupedTags.filter(f => {
					let res = false;
					try {
						const
							arr1 = JSON.stringify([... f.theirTags].sort()),
							arr2 = JSON.stringify([... item.theirTags].sort());

						res = (
							f.myTag === item.myTag 
							&& arr1 === arr2
						);
					} catch (e) {
						console.error(e);
					}
					return res;
				}).pop();

				if (groupedItem) {
					groupedItem.offers.push(item.offer);
				} else {
					groupedTags.push({
						offers: [item.offer],
						myTag: item.myTag,
						theirTags: item.theirTags,
					});
				};
			});

			Promise.all(
				(groupedTags || []).map(groupedItem => {
					return this.sdk.getBrtOfferComplexDeals({
						location: this.getStoredLocation() || [],
						myTag: groupedItem.myTag,
						theirTags: groupedItem.theirTags,
						excludeAddresses: [this.address]
					}).then(deals => {
						const 
							firstOffer = groupedItem.offers[0],
							targets = (deals || []).map(m => m.target.update({ source: firstOffer }));
						return targets[0]; // This approach is wrong, need to create a complex deal selection wizard by tags
					});
				})
			).then(results => {
				const targets = results.flat().filter(f => f);
				const uniqTargets = [];
				targets.forEach(item => {
					if (!(uniqTargets.some(f => f.hash === item.hash))) {
						uniqTargets.push(item);
					};
				});
				this.mayMatchExchanges = uniqTargets.filter(
					f => !(f?.address && banProcessor.isBannedAddress(f.address) 
						|| f?.source?.address && banProcessor.isBannedAddress(f.source.address))
					);
			}).catch(e => { 
				console.error(e);
			});
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

		"sdk.offerUpdateActionId"() {
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