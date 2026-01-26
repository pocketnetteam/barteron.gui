import Pinia from "@/stores/store.js";

const
    storageId = "profile",
    storage = Pinia.defineStore(storageId, {
        state: () => ({
            bartersView: 'tile',
            offerShareDisabled: false,
            notificationsBannerDisabled: false,
        }),

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

                if (data?.offerShareDisabled) {
                    this.offerShareDisabled = data.offerShareDisabled;
                }

                if (data?.notificationsBannerDisabled) {
                    this.notificationsBannerDisabled = data.notificationsBannerDisabled;
                }
            },

            saveState() {
                const data = {
                    bartersView: this.bartersView,
                    offerShareDisabled: this.offerShareDisabled,
                    notificationsBannerDisabled: this.notificationsBannerDisabled,
                };

                Pinia.set(storageId, data);
            },
        }
    }),
    store = storage();
    store.fetch();

store.$subscribe(() => {
    store.saveState();
});

export {
    store as default,
    storage as useProfileStore
};