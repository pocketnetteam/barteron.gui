export default {
	name: "Category",

	computed: {
		category() {
			return this.$route.params.id
		}
	}
}