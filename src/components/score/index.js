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
		},
		voteable: Boolean
	},

	data() {
		return {
			score: 0,
			voted: false
		}
	},

	methods: {
		change(index) {
			if (this.voteable && !this.voted) {
				this.score = index;
				this.voted = true;

				this.$emit("change", this.score);
			}
		}
	}
}