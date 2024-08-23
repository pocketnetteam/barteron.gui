import Pinia from "@/stores/store.js";
import Vue from "vue";

const storageId = "profile";

let watcherDisabled = false;
let currentAddress = null;

export const useProfileStore = Pinia.defineStore(storageId, {
        state: () => ({
            bartersView: 'tile',
            activeTab: null,
            activeInnerAdsTab: null,
        }),

        actions: {
            setAddress(address) {
                if (currentAddress != address) {
                    currentAddress = address;
                    
                    if (this.isMyProfile()) {
                        watcherDisabled = true;
                        this.resetActiveTabs();
                        this.fetch();
                    } else {
                        this.resetActiveTabs();
                    }
                }
            },

            isMyProfile() {
                return (currentAddress === Vue.prototype?.sdk?.address);
            },

            resetActiveTabs() {
                this.activeTab = null;
                this.activeInnerAdsTab = null;
            },

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
                    });
                }
			},

            restoreState(data) {
                if (data?.bartersView) {
                    this.bartersView = data.bartersView;
                };

                if (data?.activeTab) {
                    this.activeTab = data.activeTab;
                };

                if (data?.activeInnerAdsTab) {
                    this.activeInnerAdsTab = data.activeInnerAdsTab;
                };
            },

            saveState() {
                const data = {
                    bartersView: this.bartersView,
                    activeTab: this.activeTab,
                    activeInnerAdsTab: this.activeInnerAdsTab,
                };

                Pinia.set(storageId, data);
            },
        }
    });

const store = useProfileStore();

store.$subscribe((mutation, state) => {
    if (store.isMyProfile() && !(watcherDisabled)) {
        store.saveState();
    }
    watcherDisabled = false;
});