export default {
	name: "Loader",

	props: {
		loading: {
			type: Boolean,
			default: false
		},

		type: {
			type: {String},
			default: "main"
		}
	}
}