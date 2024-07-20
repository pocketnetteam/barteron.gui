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

	computed: {
		...mapState(useOfferStore, [
			'items',
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

		orders() {
			return this.parseLabels("orderLabels");
		},

		views() {
			return this.parseLabels("viewLabels");
		},

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

		applyFilters(newValue) {
			this.changeFilters(newValue, this.$route)
		},

		getOrderStringFromFilter() {
			const
				filters = this.getFilters(),
				orderBy = filters.orderBy ?? 'height',
				orderArrow = filters.orderDesc ? 'desc' : 'asc';
				
			return `${orderBy}_${orderArrow}`;
		},

		setOrderValueToElement() {
			const value = this.getOrderStringFromFilter();
			setValueToVSelect(this.$refs.order, value);
		},

		setBartersViewToElement() {
			setValueToVSelect(this.$refs.bartersView, this.bartersView);
		},

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

		showError(e) {
			// TODO: вынести в mixin получение номера ошибки (есть дублирование)
			const message = this.$t(
				`dialogLabels.error#${ e?.toString()?.replace(/[^\d-]/g, "") || 0 }`,
				{ details: e }
			);
			this.$refs.dialog.view("error", message);
		},

	},

	watch: {
		async $route(to, from) {
			if (to?.name === "category") {
				await this.loadFirstPage(to);
			}
		},

		async "LocationStore.geohash"() {
			await this.loadFirstPage(this.$route);
		},

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
		});

		this.$2watch("$refs.bartersView").then(() => {
			this.setBartersViewToElement();
		});

		this.setScrollOffsetIfNeeded();
	},

	beforeRouteEnter (to, from, next) {
		next(async vm => {
			const
				isListEmpty = (vm.items.length == 0),
				isReturnFromOffer = (from.name == 'barterItem'),
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