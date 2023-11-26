import Score from "@/components/score/index.vue";

export default {
	name: "Votes",

	components: {
		Score
	},

	props: {
		header: {
			type: Boolean,
			default: true
		},
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