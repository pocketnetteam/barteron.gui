import Pinia from "@/stores/store.js";

const
	storageId = "theme",
	storage = Pinia.defineStore(storageId, {
		state: () => ({
			theme: "inherit"
		}),
		
		actions: {
			fetch() {
				Pinia.getPrefix().then(() => {
					this.apply(Pinia.get(storageId, "inherit"));
				}).catch(e => { 
					console.error(e);
				});
			},

			async apply(theme) {
				if (!theme || theme === "inherit") {
					const theme = await new Promise(resolve => {
						if (Pinia.sdk._appinfo) {
							resolve(Pinia.sdk.appinfo.theme);
						} else {
							Pinia.sdk.getAppInfo().then(info => {
								resolve(info.theme);
							});
						}
					});

					this.theme = (() => {
						switch (theme.color) {
							case "#ffffff": return "inherit light";
							case "#1e2235": return "inherit navy";
							default: return "inherit dark";
						}
					})();
				} else {
					this.theme = theme;
				}
			},

			set(theme) {
				Pinia.set(storageId, theme);
				this.apply(theme);
			},

			isDarkTheme() {
				return (this.theme?.includes("navy") || this.theme?.includes("dark"));
			}
		}
	}),
	store = storage();
	store.fetch();
	
export {
	store as default,
	storage as useThemeStore
};