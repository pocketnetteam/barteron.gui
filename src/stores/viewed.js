import Pinia from "@/stores/store.js";

const
	storageId = "viewed",
	maxCount = 10,
	storage = Pinia.defineStore(storageId, {
		state: () => ({
			viewed: Pinia.get(storageId, [])
		}),
		
		actions: {
			fetch() {
				Pinia.getPrefix().then(() => {
					this.viewed = Pinia.get(storageId, []);
				}).catch(e => { 
					console.error(e);
				});
			},

			set(id) {
				if (id === "draft") return;
				
				const index = this.viewed.findIndex(offer => offer === id);

				if (index > -1) {
					this.viewed.splice(index, 1);
				}

				this.viewed = [id, ...this.viewed.slice(0, maxCount - 1)];
				
				Pinia.set(storageId, this.viewed);
			},

			updateInPatchMode(sourceHashes) {
				sourceHashes = (sourceHashes || []);
				const viewed = this.viewed.filter(item => sourceHashes.includes(item));
				if (viewed.length < this.viewed.length) {
					store.$patch({ viewed });
					Pinia.set(storageId, this.viewed);
				}
			},
		}
	}),
	store = storage();
	store.fetch();
	
export {
	store as default,
	storage as useViewedStore
};