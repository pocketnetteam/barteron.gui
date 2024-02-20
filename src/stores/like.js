import Pinia from "@/stores/store.js";

const
	storageId = "like",
	LikeStore = Pinia.defineStore(storageId, {
		state: () => ({
			like: Pinia.get(storageId, {})
		}),
		
		actions: {
			set(id) {
				if (this.like[id]) delete this.like[id];
				else this.like[id] = true;

				Pinia.set(storageId, this.like);
			}
		}
	});

export default LikeStore();