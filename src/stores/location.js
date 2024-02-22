import Vue from "vue";
import Pinia from "@/stores/store.js";

const
	storageId = "location",
	LocationStore = Pinia.defineStore(storageId, {
		state: () => ({
			location: Pinia.get(storageId, {
				geohash: null,
				near: null,
				radius: null,
				zoom: null
			})
		}),
		
		actions: {
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
					near: null,
					radius: null,
					zoom: null
				});
			}
		}
	});

export default LocationStore();