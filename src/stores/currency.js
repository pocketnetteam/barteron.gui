import Pinia from "@/stores/store.js";

const
	storageId = "currency",
	CurrencyStore = Pinia.defineStore(storageId, {
		state: () => ({
			currency: Pinia.get(storageId, "")
		}),
		
		actions: {
			set(currency) {
				this.currency = currency;
				Pinia.set(storageId, currency);
			}
		}
	});

export default CurrencyStore();