import Score from "@/components/score/index.vue";
import Comment from "@/components/votes/comment.vue";

export default {
	name: "Votes",

	components: {
		Score,
		Comment
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
		},
		offer: Object
	},

	data() {
		return {
			loading: false,
			added: [],
			score: 0,
			scores: 0
		}
	},

	computed: {
		/**
		 * Join all given comments
		 * 
		 * @returns {Array[@Comment]}
		 */
		comments() {
			return [].concat(this.items, this.added);
		}
	},

	methods: {
		/**
		 * Store vote
		 * 
		 * @param {Number} score
		 */
		vote(score) {
			this.score = score;

			/* Send vote to node */
			this.sdk.setBrtOfferVote({
				offerId: this.offer.hash,
				address: this.offer.address,
				value: this.score.toFixed()
			});
		},

		/**
		 * Send comment
		 */
		submit() {
			const
				form = this.$refs.form,
				feed = this.$refs.feedback,
				data = form.serialize();

			if (form.validate()) {
				this.loading = true;

				/* Send comment to node */
				const comment = new this.sdk.models.Comment({
					postid: this.offer.hash,
					message: data.feedback,
					info: this.score?.toFixed() || ""
				}).set().then(() => {
					feed.content = "";
					this.loading = false;
					this.added.push(comment);
				});
			}
		}
	}
}