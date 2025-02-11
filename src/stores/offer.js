import Pinia from "@/stores/store.js";
import Vue from "vue";
import Categories from "@/js/categories.js";

const 
    defaultPageSize = 18,
    storageId = "offer",
    storage = Pinia.defineStore(storageId, {
        state: () => ({
            items: [],
            itemsRoute: null,
            loadingItemsRoute: null,
            topHeight: null,
            pageStart: 0,
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
            pageSize: () => defaultPageSize,
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
                    mixin = Vue.prototype.shared,
                    tagsData = this._getTagsData(data),
                    search = data?.route?.query?.search;

                const request = {
                    ...this._filtersForRequest(),
                    ...tagsData.tagsProps,
                    ...(search && { search: `%${ search }%` }),
                    location: mixin.methods.getStoredLocation() || [],
                    topHeight: data?.topHeight,
                    pageStart: data?.pageStart || 0,
                    pageSize: data?.pageSize || this.pageSize
                };
            
                if (tagsData.isDealRequest) {
                    return Vue.prototype.sdk.getBrtOfferDeals(request);
                } else {
                    return Vue.prototype.sdk.getBrtOffersFeed(request);
                }
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
                    const
                        id = String(+data.id),
                        categories = new Categories();

                    result = categories.findChildrenRecursivelyById(id).map(item => Number(item.id));
                }
                return result;
            },

            _getExchangeOptionsTags() {
                const
                    tags = this.filters.exchangeOptionsTags || [],
                    categories = tags.length && (new Categories());

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

            _setTopHeight() {
                this.topHeight = null;
                if (this.pageStart === 0 
                    && this.filters.orderBy === "height" 
                    && this.filters.orderDesc
                ) {
                    this.topHeight = this.items?.[0]?.height;
                }
            },

            async loadFirstPage(route) {
                this.loadingItemsRoute = route;
                this.itemsRoute = null;
                this.items = [];
                
                this.topHeight = null;
                this.pageStart = 0;
                this.scrollOffset = null;

                const data = {
                    id: route.params.id,
                    route,
                    pageStart: this.pageStart
                };
                
                try {
                    this.isLoading = true;
                    this.items = await this._requestItems(data);
                    this._setTopHeight();
                    this.itemsRoute = route;
                } catch (e) {
                    console.error(e);
                    this.currentError = e;
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
                    console.error(e);
                    this.currentError = e;
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

            isFiltersActive() {
                return Object.keys(this.filters)
                    .filter(key => this.filters[key] && !(key === "orderBy" || key === "orderDesc"))
                    .some(f => Array.isArray(f) && f.length || !(Array.isArray(f)) && f);
            },

            isEmptyListFromFullSearch(currentRoute) {
                const fullSearchPaths = ["/", "/category/search?search="];
                return !(this.isLoading) 
                    && !(this.items.length) 
                    && !(this.isFiltersActive())
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