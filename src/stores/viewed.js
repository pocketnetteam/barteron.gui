import Pinia from "@/stores/store.js";

const
	storageId = "viewed",
	ViewedStore = Pinia.defineStore(storageId, {
		state: () => ({
			viewed: Pinia.get(storageId, [])
		}),
		
		actions: {
			set(id) {
				const index = this.viewed.findIndex(offer => offer === id);

				if (index > -1) {
					this.viewed.splice(index, 1);
				}

				this.viewed = [id, ...this.viewed.slice(0, 3)];

				console.log(id, this.viewed)
				
				Pinia.set(storageId, this.viewed);
			}
		}
	});

export default ViewedStore();