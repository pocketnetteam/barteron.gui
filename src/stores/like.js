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

			updateInPatchMode(sourceHashes) {
				sourceHashes = (sourceHashes || []);
				const like = this.like.filter(item => sourceHashes.includes(item));
				if (like.length < this.like.length) {
					store.$patch({ like });
					Pinia.set(storageId, this.like);
				}
			},
		}
	}),
	store = storage();
	store.fetch();

export {
	store as default,
	storage as useLikeStore
};