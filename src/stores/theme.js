import Pinia from "@/stores/store.js";

const
	storageId = "theme",
	storage = Pinia.defineStore(storageId, {
		state: () => ({
			theme: Pinia.get(storageId, "")
		}),
		
		actions: {
			fetch() {
				Pinia.getPrefix().then(() => {
					this.theme = Pinia.get(storageId, "");
				}).catch(e => { 
					console.error(e);
				});
			},

			set(theme) {
				this.theme = theme;
				Pinia.set(storageId, theme);
			}
		}
	}),
	store = storage();
	store.fetch();
	
export {
	store as default,
	storage as useThemeStore
};