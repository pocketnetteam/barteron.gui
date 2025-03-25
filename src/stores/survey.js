import Pinia from "@/stores/store.js";

const
	storageId = "survey",
	storage = Pinia.defineStore(storageId, {
		state: () => ({
			startTime: Pinia.get(storageId, null),
			isSurveyBarVisible: false,
		}),
		
		actions: {
			fetch() {
				const 
					canSyncFetch = (Pinia.prefix),
					clbk = () => {
						this.startTime = Pinia.get(storageId, null);
					};

				if (canSyncFetch) {
					clbk();
				} else {
					Pinia.getPrefix().then(() => {
						clbk();
					}).catch(e => { 
						console.error(e);
					});
				}
			},

			setStartTime(value) {
				this.startTime = value;
				Pinia.set(storageId, value);
			},

			createStartTime() {
				this.setStartTime(Date.now());
				return this.startTime;
			},
		}
	}),
	store = storage();
	store.fetch();

export {
	store as default,
	storage as useSurveyStore
};