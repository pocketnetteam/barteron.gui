import Pinia from "@/stores/store.js";

const
	storageId = "like",
	LikeStore = Pinia.defineStore(storageId, {
		state: () => ({
			like: Pinia.get(storageId, [])
		}),

		getters: {
			hasLike: (state) => {
				return (id) => state.like.findIndex(offer => offer === id) > -1;
			}
		},
		
		actions: {
			set(id) {
				const index = this.like.findIndex(offer => offer === id);

				if (index > -1) {
					this.like.splice(index, 1);
				}

				this.like = [id, ...this.like];
				
				Pinia.set(storageId, this.like);
			}
		}
	});

export default LikeStore();