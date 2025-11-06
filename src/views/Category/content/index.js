import Loader from "@/components/loader/index.vue";
import BarterList from "@/components/barter/list/index.vue";
import offerStore, { useOfferStore } from "@/stores/offer.js";
import { mapState, mapWritableState, mapActions } from "pinia";
import { useLocaleStore } from "@/stores/locale.js";

function setValueToVSelect(ref, value) {
	const
		items = ref?.items || [],
		targetItem = items.filter(item => item.value === value)[0];

	if (targetItem) {
		ref.setValue(targetItem);
	}
}

function getOrderFromString(value) {
	const state = (value || "").split("_");

	return {
		orderBy: state[0] ?? "height",
		orderDesc: state[1] === "desc"
	};
}

export default {
	name: "Content",

	components: {
		Loader,
		BarterList
	},

	inject: ["dialog"],

	computed: {
		...mapState(useOfferStore, [
			"items",
			"itemsRoute",
			"pageStart",
			"pageSize",
			"isLoading",
			"bartersView",
		]),

		...mapWritableState(useOfferStore, [
			"scrollOffset",
			"currentError",
		]),

		...mapState(useOfferStore, [
			"isSubcategory",
			"topParentCategory",
			"secondLevelParentCategory",
		]),

		...mapState(useLocaleStore, [
			"locale",
		]),

		isHomeRoute() {
			return this.$route?.name === "home";
		},

		/**
		 * Make list of order by
		 * 
		 * @returns {Array}
		 */
		orders() {
			return this.parseLabels("orderLabels");
		},

		/**
		 * Make list of view
		 * 
		 * @returns {Array}
		 */
		views() {
			return this.parseLabels("viewLabels");
		},

		/**
		 * All items of the list are loaded
		 * 
		 * @returns {Boolean}
		 */
		allItemsAreLoaded() {
			return (this.items.length < (this.pageStart + 1) * this.pageSize)
		},

		/**
		 * The top parent categories to show prompt.
		 * The offers in these categories were created before 
		 * they were detailed into subcategories, so the subcategories 
		 * will be empty at first and we need to prompt the user 
		 * to look at the top parent category.
		 * 
		 * @returns {Array}
		 */
		topParentCategoriesToShowPrompt() {
			return [13587, 6000, 619, 888, 2984, 10542, 11700, 20, 293, 625, 58058, 15032, 1249, 1, 21, 281, 267, 550];
		},

		/**
		 * The service category unites many subcategories, 
		 * each with a different theme, which contain child categories. 
		 * Previously existing subcategories within the Services category 
		 * have been moved as child categories within the new structure. 
		 * Therefore, users should be prompted to view the parent category 
		 * within Services if its subcategories contain few offers or empty.
		 * 
		 * @returns {Array}
		 */
		servicesSubcategoriesToShowPrompt() {
			return [3, 40, 4, 5, 26395, 7, 8, 9, 10, 22];
		},

		clothingFootwearAccessoriesSubcategoriesToShowPrompt() {
			return [11451, 11534, 11644];
		},

		musicAndVideoSubcategoriesToShowPrompt() {
			return [11233, 11232];
		},

		viewingParentCategory() {
			return !(this.isLoading || this.isSearchEnabled() || this.isFiltersActive()) 
				&& (this.items?.length < 10) 
				&& this.isSubcategory
				&& (
					 this.topParentCategoriesToShowPrompt.includes(this.topParentCategory.id) && this.topParentCategory
					|| this.servicesSubcategoriesToShowPrompt.includes(this.secondLevelParentCategory?.id) && this.secondLevelParentCategory
					|| this.clothingFootwearAccessoriesSubcategoriesToShowPrompt.includes(this.secondLevelParentCategory?.id) && this.secondLevelParentCategory
					|| this.musicAndVideoSubcategoriesToShowPrompt.includes(this.secondLevelParentCategory?.id) && this.secondLevelParentCategory
				);
		},
	},

	methods: {
		...mapActions(useOfferStore, [
			"loadFirstPage",
			"loadMore",
			"changeOrder",
			"changeView",
			"isSearchEnabled",
			"isFiltersActive",
			"changeFilters",
			"getFilters"
		]),

		showMoreEvent() {
			this.loadMore(this.$route);
		},

		selectOrderEvent(newValue) {
			const newOrder = getOrderFromString(newValue?.value);
			this.changeOrder(newOrder, this.$route);
		},

		selectViewEvent(newValue) {
			this.changeView(newValue?.value);
		},

		/**
		 * Apply filters
		 * 
		 * @param {Object} newValue
		 */
		applyFilters(newValue) {
			this.changeFilters(newValue, this.$route)
		},

		/**
		 * Get order string from filter
		 * 
		 * @returns {String}
		 */
		getOrderStringFromFilter() {
			const
				filters = this.getFilters(),
				orderBy = filters.orderBy ?? "height",
				orderArrow = filters.orderDesc ? "desc" : "asc";
				
			return `${orderBy}_${orderArrow}`;
		},

		/**
		 * Set order value to element
		 */
		setOrderValueToElement() {
			const value = this.getOrderStringFromFilter();
			setValueToVSelect(this.$refs.order, value);
		},

		/**
		 * Set barters view to element
		 */
		setBartersViewToElement() {
			setValueToVSelect(this.$refs.bartersView, this.bartersView);
		},

		isEmptyListFromFullSearch() {
			return offerStore.isEmptyListFromFullSearch(this.$route);
		},

		/**
		 * Reset account location
		 */
		reset() {
			const canReset = (this.locationStore.bounds);
			if (canReset) {
				this.locationStore.reset({onlyBounds: true});
			} else {
				this.loadFirstPage(this.$route);
			};
		},
	},

	watch: {
		/**
		 * Watch for route change to preload items
		 * 
		 * @param {Object} to
		 * @param {Object} from
		 */
		async $route(to) {
			if (to?.name === "category") {
				await this.loadFirstPage(to);
			}
		},

		/**
		 * Watch for location change to preload items
		 */
		async "locationStore.bounds"() {
			await this.loadFirstPage(this.$route);
		},

		/**
		 * Watch for current error change to show dialog
		 */
		currentError() {
			if (this.currentError) {
				this.showError(this.currentError)
				this.currentError = null;
			}
		},

		locale() {
			this.$nextTick(() => {
				this.setOrderValueToElement();
				this.setBartersViewToElement();
			});
		},
	},

	mounted() {
		if (!(this.isHomeRoute)) {
			this.waitForRefs("order, bartersView").then(() => {
				this.setOrderValueToElement();
				this.setBartersViewToElement();
			}).catch(e => { 
				console.error(e);
			});
		}
	},

	beforeRouteEnter (to, from, next) {
		next(async vm => {
			const
				isListEmpty = (vm.items.length == 0),
				isReturnFromOffer = (
					from.name == "barterItem" 
					&& to.fullPath === vm.itemsRoute?.fullPath
				),
				needReloadOffers = (isListEmpty || !(isReturnFromOffer));

			if (needReloadOffers) {
				await vm.loadFirstPage(to);
			}
		});
	},

	beforeRouteLeave(to, from, next) {
		const isEnterToOffer = (to.name == "barterItem");
		if (isEnterToOffer) {
			const el = document.body;
			this.scrollOffset = {x: el.scrollLeft, y: el.scrollTop};
		}
		next();
	},
}