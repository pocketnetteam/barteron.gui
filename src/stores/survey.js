import Pinia from "@/stores/store.js";

const
	storageId = "survey",
	storage = Pinia.defineStore(storageId, {
		state: () => ({
			isSurveyBarVisible: false,
		}),
	}),
	store = storage();

export {
	store as default,
	storage as useSurveyStore
};