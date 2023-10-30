export default {
	name: "Loader",

	props: {
		loading: {
			type: Boolean,
			default: true
		},

		type: {
			type: String,
			default: "main"
		}
	}
}