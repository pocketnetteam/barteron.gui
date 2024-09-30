import Pinia from "@/stores/store.js";

const
	storageId = "location",
	storage = Pinia.defineStore(storageId, {
		state: () => ({
			location: Pinia.get(storageId, {
				geohash: null,
				radius: null,
				zoom: null
			})
		}),
		
		actions: {
			fetch() {
				Pinia.getPrefix().then(() => {
					this.location = Pinia.get(storageId, {
						geohash: null,
						radius: null,
						zoom: null
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
					geohash: null,
					radius: null,
					zoom: null
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