export default {
	name: "Score",

	props: {
		rating: {
			type: [Boolean, String],
			default: false
		},
		stars: {
			type: Number,
			default: 5
		},
		value: {
			type: Number,
			default: null
		}
	},

	data() {
		return {
			score: 0
		}
	},

	methods: {
		change(index) {
			if (this.value === null) {
				this.score = index;
				this.$emit("change", this.score);
			}
		}
	}
}