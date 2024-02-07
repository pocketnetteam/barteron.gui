import Pinia from "@/stores/store.js";
import { locales } from "@/i18n/index.js";

const
	storageId = "locale",
	localeStore = Pinia.defineStore(storageId, {
		state: () => ({
			locale: Pinia.get(storageId, "")
		}),

		getters: {
			list: () => locales,
		},
		
		actions: {
			set(locale) {
				this.locale = locale;
				Pinia.set(storageId, locale);
			}
		}
	});

export default localeStore();