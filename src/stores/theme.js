import Pinia from "@/stores/store.js";

const
	storageId = "theme",
	storage = Pinia.defineStore(storageId, {
		state: () => ({
			theme: (() => {
				let value = Pinia.get(storageId, "");
				
				if (!value) {
					value = (async () => {
						const appinfo = await Pinia.sdk.getAppInfo();

						switch (appinfo.theme.color) {
							case "#ffffff": return "light";
							// case "#1e2235": return "navy";
							default: return "dark";
						}
					})();
				}

				return value;
			})()
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