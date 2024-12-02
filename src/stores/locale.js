import Pinia from "@/stores/store.js";
import { locales } from "@/i18n/index.js";

const
	storageId = "locale",
	inheritLocale = "inherit",
	storage = Pinia.defineStore(storageId, {
		state: () => ({
			locale: inheritLocale
		}),

		getters: {
			list: () => [inheritLocale, ...locales],
			inheritLocale: () => inheritLocale
		},
		
		actions: {
			fetch() {
				Pinia.getPrefix().then(() => {
					this.locale = Pinia.get(storageId, inheritLocale);
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