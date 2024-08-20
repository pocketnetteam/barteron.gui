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
			}
		}
	});

const store = LikeStore();
store.fetch();

export default store;