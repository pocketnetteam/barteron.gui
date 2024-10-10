import Pinia from "@/stores/store.js";

const
	storageId = "theme",
	storage = Pinia.defineStore(storageId, {
		state: () => ({
			theme: "inherit"
		}),
		
		actions: {
			fetch() {
				Pinia.getPrefix().then(async () => {
					this.theme = Pinia.get(storageId, "inherit");
					this.apply(this.theme);
				}).catch(e => { 
					console.error(e);
				});
			},

			apply(theme) {
				if (!theme || theme === "inherit") {
					this.theme = (async () => {
						const theme = await (async () => {
							if (Pinia.sdk._appinfo) {
								return Pinia.sdk.appinfo.theme;
							} else {
								const result = await Pinia.sdk.getAppInfo();
								return result.theme;
							}
						})();

						switch (theme.color) {
							case "#ffffff": return "light";
							// case "#1e2235": return "navy";
							default: return "dark";
						}
					})();
				} else {
					this.theme = theme;
				}
			},

			set(theme) {
				Pinia.set(storageId, theme);
				this.apply(theme);
			}
		}
	}),
	store = storage();
	store.fetch();
	
export {
	store as default,
	storage as useThemeStore
};