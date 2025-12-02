import Pinia from "@/stores/store.js";

const
	storageId = "safeDeal",
	storage = Pinia.defineStore(storageId, {
		state: () => ({
			safeDeal: Pinia.get(storageId, {})
		}),
		
		actions: {
			fetch() {
				const 
					canSyncFetch = (Pinia.prefix),
					clbk = () => {
						this.safeDeal = Pinia.get(storageId, {});
					};

				if (canSyncFetch) {
					clbk();
				} else {
					Pinia.getPrefix().then(() => {
						clbk();
					}).catch(e => { 
						console.error(e);
					});
				}
			},

			add(data) {
				this.safeDeal = {
					...this.safeDeal,
					...data
				};
				Pinia.set(storageId, this.safeDeal);
			},

			get(id) {
				return this.safeDeal[id];
			},

			remove(id) {
				delete this.safeDeal[id];
				Pinia.set(storageId, this.safeDeal);
			},
		}
	}),
	store = storage();
	store.fetch();

export {
	store as default,
	storage as useSafeDealStore
};