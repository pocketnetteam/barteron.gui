import Pinia from "@/stores/store.js";
import Vue from "vue";
import Categories from "@/js/categories.js";
import AppErrors from "@/js/appErrors.js";

const 
    defaultPageSize = 18,
    homePageSize = 12,
    storageId = "offer",
    categories = new Categories(),
    storage = Pinia.defineStore(storageId, {
        state: () => ({
            items: [],
            itemsRoute: null,
            loadingItemsRoute: null,
            topHeight: null,
            pageStart: 0,
            pageSize: defaultPageSize,
            isLoading: false,
            filters: {
                orderBy: "height",
                orderDesc: true
            },
            bartersView: "tile",
            scrollOffset: null,
            currentError: null,
        }),

        getters: {
            parentCategories: (state) => {
                const id = state.itemsRoute?.params?.id;
                return categories.getParentsById(id);
            },

            isSubcategory: (state) => {
                return state.parentCategories?.length;
            },

            topParentCategory: (state) => {
                return state.parentCategories?.[0];
            },

            secondLevelParentCategory: (state) => {
                return state.parentCategories?.[1];
            },
        },        
        
        actions: {
            fetch() {
                const 
                    canSyncFetch = (Pinia.prefix),
                    clbk = () => {
                        const data = Pinia.get(storageId, {});
                        this.restoreState(data);
                    };

                if (canSyncFetch) {
                    clbk();
                } else {
                    Pinia.getPrefix().then(() => {
                        clbk();
                    }).catch(e => { 
                        console.error(e);
                    });
                }
			},

            restoreState(data) {
                if (data?.bartersView) {
                    this.bartersView = data.bartersView;
                };

                if (data?.order) {
                    this.setOrderInFilter(data.order);
                };
            },

            saveState() {
                const data = {
                    bartersView: this.bartersView,
                    order: {
                        orderBy: this.filters.orderBy,
                        orderDesc: this.filters.orderDesc
                    },
                };

                Pinia.set(storageId, data);
            },

            _requestItems(data) {
				const 
                    ids = Vue.prototype.sdk.requestServiceData.ids,
                    checkingData = this._createRequestCheckingData();

				ids[checkingData.requestSource] = checkingData.requestId;

                const 
                    mixin = Vue.prototype.shared,
                    isHomeRoute = (data?.route?.name === "home"),
                    disableFilterAndSearch = isHomeRoute;

                if (disableFilterAndSearch) {
                    const request = {
                        orderBy: "height",
                        orderDesc: true,
                        location: mixin.methods.getStoredLocation() || [],
                        topHeight: data?.topHeight,
                        pageStart: data?.pageStart || 0,
                        pageSize: this.pageSize,
                        checkingData,
                    };
                
                    return Vue.prototype.sdk.getBrtOffersFeed(request);
                } else {
                    const
                        tagsData = this._getTagsData(data),
                        search = data?.route?.query?.search;

                    const request = {
                        ...this._filtersForRequest(),
                        ...tagsData.tagsProps,
                        ...(search && { search: `%${ search }%` }),
                        location: mixin.methods.getStoredLocation() || [],
                        topHeight: data?.topHeight,
                        pageStart: data?.pageStart || 0,
                        pageSize: this.pageSize,
                        checkingData,
                    };

                    return tagsData.isDealRequest ? 
                        Vue.prototype.sdk.getBrtOfferDeals(request)
                        : Vue.prototype.sdk.getBrtOffersFeed(request);
                }
            },

            _createRequestCheckingData() {
                return {
					requestSource: "offerStorage",
					requestId: Math.round(Math.random() * 1e+10),
					checkRequestId: true,
				};
            },

            _getTagsData(data) {
                const
                    requestTags = this._getRequestTags(data),
                    exchangeOptionsTags = this._getExchangeOptionsTags(),
                    isDealRequest = exchangeOptionsTags?.length;

                const tagsProps = {};
                if (isDealRequest) {
                    tagsProps.myTags = exchangeOptionsTags;
                    tagsProps.theirTags = requestTags;
                } else {
                    tagsProps.tags = requestTags;
                }

                return {
                    tagsProps,
                    isDealRequest
                };
            },

            _getRequestTags(data) {
                let result = [];
                if (Number.isInteger(+data?.id)) {
                    const id = String(+data.id);
                    result = categories.findChildrenRecursivelyById(id).map(item => Number(item.id));
                }
                return result;
            },

            _getExchangeOptionsTags() {
                const tags = this.filters.exchangeOptionsTags || [];
                const result = tags.reduce(
                    (res, id) => {
                        const foundTags = categories.findChildrenRecursivelyById(id).map(item => Number(item.id));
                        return res.concat(foundTags);
                    },
                    []
                );

                return result;
            },

            _filtersForRequest() {
                const result = {
                    ...this.filters
                };
                delete result.exchangeOptionsTags;
                return result;
            },

            _setTopHeight(data) {
                this.topHeight = null;

                const 
                    isFirstPage = this.pageStart === 0,
                    isHomeRoute = data?.route?.name === "home",
                    isHeightDescOrder = (this.filters.orderBy === "height" 
                        && this.filters.orderDesc);

                if (isFirstPage && (isHomeRoute || isHeightDescOrder)) {
                    this.topHeight = this.items?.[0]?.height;
                }
            },

            async loadFirstPage(route) {
                this.loadingItemsRoute = route;
                this.itemsRoute = null;
                this.items = [];
                
                this.topHeight = null;
                this.pageStart = 0;
                this.pageSize = (route?.name === "home" ? homePageSize : defaultPageSize);
                this.scrollOffset = null;

                const data = {
                    id: route.params.id,
                    route,
                    pageStart: this.pageStart
                };
                
                try {
                    this.isLoading = true;
                    this.items = await this._requestItems(data);
                    this._setTopHeight(data);
                    this.itemsRoute = route;
                } catch (e) {
                    const
                        requestRejected = (e instanceof AppErrors.RequestIdError),
                        needHandleError = !(requestRejected);

                    if (needHandleError) {
                        console.error(e);
                        this.currentError = e;
                    } else {
                        console.info(e.message);
                    }
                } finally {
                    this.isLoading = false;
                    this.loadingItemsRoute = null;
                }
            },

            async loadMore(route) {
                const data = {
                    id: route.params.id,
                    route: route,
                    topHeight: this.topHeight,
                    pageStart: (this.pageStart + 1),
                };

                try {
                    this.isLoading = true;
                    const items = await this._requestItems(data);
                    this.itemsRoute = route;

                    this.pageStart++;
                    this.items = this.items.concat(items);
                } catch (e) {
                    const
                        requestRejected = (e instanceof AppErrors.RequestIdError),
                        needHandleError = !(requestRejected);

                    if (needHandleError) {
                        console.error(e);
                        this.currentError = e;
                    } else {
                        console.info(e.message);
                    }
                } finally {
                    this.isLoading = false;
                }
            },

            async changeOrder(newValue, route) {
                this.setOrderInFilter(newValue);
                this.saveState();
                
                await this.loadFirstPage(route);
            },

            changeView(newValue) {
                this.bartersView = newValue;
                this.saveState();
            },

            setOrderInFilter(newValue) {
                this.updateFiltersFromValue(newValue);
            },

            updateFiltersFromValue(newValue) {
                this.filters = {
                    ...this.filters,
                    ...newValue
                };
            },

            async changeFilters(inputFilters, route) {
                this.updateFiltersFromValue(inputFilters);
                await this.loadFirstPage(route);
            },

            getFilters() {
                return this.filters;
            },

            setFiltersForNewOffers() {
                this.filters = {
                    orderBy: "height",
                    orderDesc: true
                };
            },

            getRouteForNewOffers() {
                return {
                    name: "category",
                    params: { id: "search" },
                    query: { search: "" }
                };
            },

            isSearchEnabled() {
                return (this.loadingItemsRoute?.query?.search || this.itemsRoute?.query?.search);
            },

            isFiltersActive() {
                return Object.keys(this.filters)
                    .filter(key => this.filters[key] && !(key === "orderBy" || key === "orderDesc"))
                    .some(f => Array.isArray(f) && f.length || !(Array.isArray(f)) && f);
            },

            isEmptyListFromFullSearch(currentRoute) {
                const 
                    fullSearchPaths = ["/", "/category/search?search="],
                    isHomeRoute = currentRoute?.name === "home",
                    isFiltersActive = isHomeRoute ? false : this.isFiltersActive();

                return !(this.isLoading) 
                    && !(this.items.length) 
                    && !(isFiltersActive)
                    && this.itemsRoute
                    && this.itemsRoute.fullPath === currentRoute?.fullPath
                    && fullSearchPaths.includes(this.itemsRoute.fullPath);
            },
        }
    }),
    store = storage();
    store.fetch();

export {
    store as default,
    storage as useOfferStore
};