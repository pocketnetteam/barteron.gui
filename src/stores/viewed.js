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

			update(sourceHashes) {
				sourceHashes = (sourceHashes || []);
				const removingItems = this.viewed.filter(item => !(sourceHashes.includes(item)));
				if (removingItems.length) {
					removingItems.forEach(item => {
						this.remove(item, { isMultiple: true });
					})
					Pinia.set(storageId, this.viewed);
				}
			},

			remove(id, options = { isMultiple: false }) {
				const
					index = this.viewed.findIndex(item => item === id),
					needRemove = (index > -1),
					needSave = !(options?.isMultiple);

				if (needRemove) {
					this.viewed.splice(index, 1);
					if (needSave) {
						Pinia.set(storageId, this.viewed);
					}
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