export default {
	name: "Score",

	props: {
		mode: {
			type: String,
			default: "regular" // values: regular, preview
		},
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
		starsValue: {
			type: Number,
			default: null
		},
		delimeter: {
			type: String,
			default: "."
		},
		votesCount: {
			type: Number,
			default: 0
		},
		relayMode: {
			type: Boolean,
			default: false
		},
		rejected: {
			type: Boolean,
			default: false
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
		},

		reset() {
			this.score = 0;
			this.voted = false;
		}
	},

	watch: {
		rejected(newValue) {
			if (newValue) {
				this.reset();
			}
		}
	}
}