import Pinia from "@/stores/store.js";
import { locales } from "@/i18n/index.js";

const
	storageId = "locale",
	storage = Pinia.defineStore(storageId, {
		state: () => ({
			locale: Pinia.get(storageId, "")
		}),

		getters: {
			list: () => locales,
		},
		
		actions: {
			fetch() {
				Pinia.getPrefix().then(() => {
					this.locale = Pinia.get(storageId, "");
				}).catch(e => { 
					console.error(e);
				});
			},

			set(locale) {
				this.locale = locale;
				Pinia.set(storageId, locale);
			}
		}
	}),
	store = storage();
	store.fetch();
	
export {
	store as default,
	storage as useLocaleStore
};