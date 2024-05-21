import Pinia from "@/stores/store.js";

const
	storageId = "currency",
	CurrencyStore = Pinia.defineStore(storageId, {
		state: () => ({
			currency: Pinia.get(storageId, "")
		}),
		
		actions: {
			fetch() {
				Pinia.getPrefix().then(() => {
					this.currency = Pinia.get(storageId, "");
				});
			},

			set(currency) {
				this.currency = currency;
				Pinia.set(storageId, currency);
			}
		}
	});

	const store = CurrencyStore();
	store.fetch();
	
export default store;