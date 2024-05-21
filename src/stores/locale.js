import Pinia from "@/stores/store.js";
import { locales } from "@/i18n/index.js";

const
	storageId = "locale",
	LocaleStore = Pinia.defineStore(storageId, {
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
				});
			},

			set(locale) {
				this.locale = locale;
				Pinia.set(storageId, locale);
			}
		}
	});

const store = LocaleStore();
store.fetch();
	
export default store;