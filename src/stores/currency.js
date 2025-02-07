import Pinia from "@/stores/store.js";

const
	storageId = "currency",
	storage = Pinia.defineStore(storageId, {
		state: () => ({
			currency: Pinia.get(storageId, "")
		}),
		
		actions: {
			fetch() {
				const 
					canSyncFetch = (Pinia.prefix),
					clbk = () => {
						this.currency = Pinia.get(storageId, "");
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

			set(currency) {
				this.currency = currency;
				Pinia.set(storageId, currency);
			}
		}
	}),
	store = storage();
	store.fetch();

export {
	store as default,
	storage as useCurrencyStore
};