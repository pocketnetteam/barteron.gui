import Loader from "@/components/loader/index.vue";
import BarterList from "@/components/barter/list/index.vue";
import { useOfferStore } from "@/stores/offer.js";
import { mapState, mapWritableState, mapActions } from "pinia";

function setValueToVSelect(el, value) {
	const
		items = el?.items || [],
		targetItem = items.filter(item => item.value === value)[0];

	if (targetItem) {
		el.setValue(targetItem);
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
			'items',
			'itemsRoute',
			'pageStart',
			'isLoading',
			'bartersView',
		]),

		...mapWritableState(useOfferStore, [
			'scrollOffset',
			'currentError',
		]),

		...mapState(useOfferStore, [
			'pageSize',
		]),

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

	},

	methods: {
		...mapActions(useOfferStore, [
			'loadFirstPage',
			'loadMore',
			'changeOrder',
			'changeView',
			'changeFilters',
			'getFilters'
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
				orderBy = filters.orderBy ?? 'height',
				orderArrow = filters.orderDesc ? 'desc' : 'asc';
				
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

		/**
		 * Set scroll offset if needed
		 */
		setScrollOffsetIfNeeded() {
			if (this.scrollOffset) {
				document.body.scrollTo({
					top: this.scrollOffset.y,
					left: this.scrollOffset.x,
					behavior: "instant",
				});
				this.scrollOffset = null;
			}
		},

		/**
		 * Show error
		 * 
		 * @param {Object} e
		 */
		showError(e) {
			this.dialog?.instance.view("error", this.sdk.errorMessage(e));
		},
	},

	watch: {
		/**
		 * Watch for route change to preload items
		 * 
		 * @param {Object} to
		 * @param {Object} from
		 */
		async $route(to, from) {
			if (to?.name === "category") {
				await this.loadFirstPage(to);
			}
		},

		/**
		 * Watch for location change to preload items
		 */
		async "LocationStore.geohash"() {
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
	},

	mounted() {
		this.$2watch("$refs.order").then(() => {
			this.setOrderValueToElement();
		}).catch(e => { 
			console.error(e);
		});

		this.$2watch("$refs.bartersView").then(() => {
			this.setBartersViewToElement();
		}).catch(e => { 
			console.error(e);
		});

		this.setScrollOffsetIfNeeded();
	},

	beforeRouteEnter (to, from, next) {
		next(async vm => {
			const
				isListEmpty = (vm.items.length == 0),
				isReturnFromOffer = (
					from.name == 'barterItem' 
					&& to.fullPath === vm.itemsRoute?.fullPath
				),
				needReloadOffers = (isListEmpty || !(isReturnFromOffer));

			if (needReloadOffers) {
				await vm.loadFirstPage(to);
			}
		});
	},

	beforeRouteLeave(to, from, next) {
		const isEnterToOffer = (to.name == 'barterItem');
		if (isEnterToOffer) {
			const el = document.body;
			this.scrollOffset = {x: el.scrollLeft, y: el.scrollTop};
		}
		next();
	},
}