import Loader from "@/components/loader/index.vue";

export default {
	name: "VideoPreview",

	components: {
		Loader,
	},

	props: {
		thumbnailUrl: {
			type: String,
			default: null
		},
		alternateText: {
			type: String,
			default: ""
		},
		disableLoader: {
			type: Boolean,
			default: false
		},
		loadingDataError: {
			type: Error,
			default: null
		}
	},
}