import Pinia from "@/stores/store.js";

const
	storageId = "like",
	storage = Pinia.defineStore(storageId, {
		state: () => ({
			like: Pinia.get(storageId, [])
		}),

		getters: {
			hasLike: (state) => {
				return (id) => state.like.findIndex(offer => offer === id) > -1;
			}
		},
		
		actions: {
			fetch() {
				Pinia.getPrefix().then(() => {
					this.like = Pinia.get(storageId, []);
				}).catch(e => { 
					console.error(e);
				});
			},

			set(id) {
				const index = this.like.findIndex(offer => offer === id);

				if (index > -1) {
					this.like.splice(index, 1);
				} else {
					this.like.push(id);
				}

				Pinia.set(storageId, this.like);
			},

			update(sourceHashes) {
				sourceHashes = (sourceHashes || []);
				const removingItems = this.like.filter(item => !(sourceHashes.includes(item)));
				if (removingItems.length) {
					removingItems.forEach(item => {
						this.remove(item, { isMultiple: true });
					})
					Pinia.set(storageId, this.like);
				}
			},

			remove(id, options = { isMultiple: false }) {
				const
					index = this.like.findIndex(item => item === id),
					needRemove = (index > -1),
					needSave = !(options?.isMultiple);

				if (needRemove) {
					this.like.splice(index, 1);
					if (needSave) {
						Pinia.set(storageId, this.like);
					}
				}
			},
		}
	}),
	store = storage();
	store.fetch();

export default store;