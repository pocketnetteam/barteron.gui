import Pinia from "@/stores/store.js";

const
	storageId = "viewed",
	ViewedStore = Pinia.defineStore(storageId, {
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

				this.viewed = [id, ...this.viewed.slice(0, 3)];
				
				Pinia.set(storageId, this.viewed);
			}
		}
	});

const store = ViewedStore();
store.fetch();
	
export default store;