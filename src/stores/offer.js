import Pinia from "@/stores/store.js";
import Vue from "vue";
import Categories from "@/js/categories.js";

const 
    defaultPageSize = 12,
    storageId = "offer",
    storage = Pinia.defineStore(storageId, {
        state: () => ({
            items: [],
            itemsRoute: null,
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
				Pinia.getPrefix().then(() => {
                    const data = Pinia.get(storageId, {});
                    this.restoreState(data);
				}).catch(e => { 
                    console.error(e);
                });
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

            _requestItems(request) {
                const
                    mixin = Vue.prototype.shared,
                    search = request?.route?.query?.search;
            
                return Vue.prototype.sdk.getBrtOfferDeals({
                    ...this.filters,
                    ...(search && { search: `%${ search }%` }),
                    location: mixin.methods.getStoredLocation() || [],
                    theirTags: this._getTheirTags(request),
                    topHeight: request?.topHeight,
                    pageStart: request?.pageStart || 0,
                    pageSize: request?.pageSize || this.pageSize
                });
            },

            _getTheirTags(request) {
                let result = [];
                if (Number.isInteger(+request?.id)) {
                    const
                        id = String(+request.id),
                        categories = new Categories();

                    result = categories.findChildrenRecursivelyById(id).map(item => Number(item.id));
                }
                return result;
            },

            async loadFirstPage(route) {
                this.topHeight = null;
                this.pageStart = 0;
                this.scrollOffset = null;

                const data = {
                    id: route.params.id,
                    route,
                    topHeight: this.topHeight,
                    pageStart: this.pageStart
                };
                
                try {
                    this.isLoading = true;
                    this.items = await this._requestItems(data);
                    this.topHeight = this.items?.[0]?.height;
                    this.itemsRoute = route;
                } catch (e) {
                    console.error(e);
                    this.currentError = e;
                } finally {
                    this.isLoading = false;
                }
            },

            async loadMore(route) {
                const data = {
                    id: route.params.id,
                    route: route,
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

        }
    }),
    store = storage();
    store.fetch();

export {
    store as default,
    storage as useOfferStore
};