import Pinia from "@/stores/store.js";
import Vue from "vue";

const 
    defaultPageSize = 24,
    storageId = "offer",
    subStorageId = (key) => `${storageId}_${key}`;

export const useOfferStore = Pinia.defineStore(storageId, {
        state: () => ({
            items: [],
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
					this.bartersView = Pinia.get(subStorageId('bartersView'), 'tile');

                    const order = Pinia.get(subStorageId('order'), {});
                    this.setOrderInFilter(order);
				});
			},

            _requestItems(request) {
                const
                    mixin = Vue.prototype.shared,
                    search = request?.route?.query?.search;
            
                return Vue.prototype.sdk.getBrtOfferDeals({
                    ...this.filters,
                    ...(search && { search: `%${ search }%` }),
                    location: mixin.computed.locationStore().near || [],
                    theirTags: Number.isInteger(+request?.id) ? [+request.id] : [],
                    pageStart: request?.pageStart || 0,
                    pageSize: request?.pageSize || this.pageSize
                });
            },

            async loadFirstPage(route) {
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
                Pinia.set(subStorageId('order'), newValue);
                this.setOrderInFilter(newValue);
                await this.loadFirstPage(route);
            },

            changeView(newValue) {
                this.bartersView = newValue;
                Pinia.set(subStorageId('bartersView'), this.bartersView);
            },

            setOrderInFilter(newValue) {
                this.filters = {
                    ...this.filters,
                    ...newValue
                };
            },

            async changeFilters(inputFilters, route) {
                this.filters = {
                    ...this.filters,
                    ...inputFilters
                };

                await this.loadFirstPage(route);
            },

            getFilters() {
                return this.filters;
            },

        }
    });

const store = useOfferStore();
store.fetch();
