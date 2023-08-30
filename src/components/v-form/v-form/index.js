export default {
	name: "Vform",

	props: {
		fields: {
			type: String,
			default: "*[name]"
		},
		rules: {
			type: Array,
			default: () => [
				/* {
					"input[name='title']": {

					}
				} */
			]
		}
	},

	data() {
		return {
			form: this
		}
	},

	methods: {
		validate() {

		},

		/**
		 * Serialize form data
		 * 
		 * @return {Object}
		 */
		serialize() {
			return Object.fromEntries(new FormData(this.$refs.form).entries())
		}
	},
}