import Pinia from "@/stores/store.js";

const
	storageId = "location",
	storage = Pinia.defineStore(storageId, {
		state: () => ({
			location: Pinia.get(storageId, {
				geohash: null,
				zoom: null,
				bounds: null,
			})
		}),
		
		actions: {
			fetch() {
				Pinia.getPrefix().then(() => {
					this.location = Pinia.get(storageId, {
						geohash: null,
						zoom: null,
						bounds: null,
					});
				}).catch(e => { 
					console.error(e);
				});
			},

			set(data) {
				this.location = data;

				Pinia.set(storageId, {
					...this.location,
					...data
				});
			},

			reset() {
				this.set({
					...this.location, 
					bounds: null,
				});
			}
		}
	}),
	store = storage();
	store.fetch();

export {
	store as default,
	storage as useLocationStore
};