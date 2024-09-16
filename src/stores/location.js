import Pinia from "@/stores/store.js";

const
	storageId = "location",
	LocationStore = Pinia.defineStore(storageId, {
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
	});

const store = LocationStore();
store.fetch();

export default store;