export default {
	name: "Feedbacks",

	props: {
		form: {
			type: Boolean,
			default: false
		},
		
		items: {
			type: Array,
			default: () => []
		}
	}
}