import Pinia from "@/stores/store.js";
import Vue from "vue";

let watcherDisabled = false;
let currentAddress = null;

const
    storageId = "profile",
    storage = Pinia.defineStore(storageId, {
        state: () => ({
            bartersView: 'tile',
            activeTab: null,
            activeInnerAdsTab: null,
            appBannerDisabled: false,
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
                    }).catch(e => { 
                        console.error(e);
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

                if (data?.appBannerDisabled) {
                    this.appBannerDisabled = data.appBannerDisabled;
                }
            },

            saveState() {
                const data = {
                    bartersView: this.bartersView,
                    activeTab: this.activeTab,
                    activeInnerAdsTab: this.activeInnerAdsTab,
                    appBannerDisabled: this.appBannerDisabled,
                };

                Pinia.set(storageId, data);
            },
        }
    });

const store = storage();

store.$subscribe(() => {
    if (store.isMyProfile() && !(watcherDisabled)) {
        store.saveState();
    }

    watcherDisabled = false;
});

export {
    store as default,
    storage as useProfileStore
};