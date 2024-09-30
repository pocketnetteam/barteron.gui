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
		item: Object
	},

	data() {
		return {
			loading: false,
			score: 0
		}
	},

	inject: ["dialog"],

	computed: {
		/**
		 * Get offer details
		 * 
		 * @returns {Object}
		 */
		details() {
			return this.sdk.barteron.details[this.item?.hash];
		},

		/**
		 * Get offer scores
		 * 
		 * @returns {Array}
		 */
		votes() {
			return this.details?.offerScores;
		},

		/**
		 * Get offer scores average
		 * 
		 * @returns {Number}
		 */
		votesAverage() {
			return this.votes?.reduce((a, v) => {
				return a += v?.i1;
			}, 0);
		},

		/**
		 * Calc that you are already voted
		 * 
		 * @returns {Boolean}
		 */
		voteable() {
			return !this.votes?.filter(f => f.s1 === this.sdk.address).pop();
		},

		/**
		 * Get all comments for offer
		 * 
		 * @returns {Array[@Comment]}
		 */
		comments() {
			return this.details?.comments || [];
		},

		/**
		 * Calc that you are already commented
		 * 
		 * @returns {Boolean}
		 */
		commentable() {
			return !this.comments?.filter(f => f.address === this.sdk.address).pop();
		},
	},

	methods: {
		/**
		 * Store vote
		 * 
		 * @param {Number} score
		 */
		vote(score) {
			/* Send vote to node */
			this.sdk.setBrtOfferVote({
				offerId: this.item.hash,
				address: this.item.address,
				value: score
			}).then(() => {
				this.score = score;

				this.votes?.push({
					i: score,
					s1: this.sdk.address
				});
			}).catch(e => {
				this.showError(e);
			});
		},

		/**
		 * Send comment
		 */
		submit() {
			const
				form = this.$refs.form,
				feed = this.$refs.vote,
				data = form.serialize();

			if (form.validate() && !this.loading) {
				this.loading = true;

				/* Create comment model */
				const comment = new this.sdk.models.Comment({
					postid: this.item.hash,
					address: this.sdk.address,
					message: data.vote,
					info: this.score?.toFixed() || ""
				});
				
				/* Send comment to node and reset fields */
				comment.set().then(() => {
					feed.content = "";
					this.score = 0;
					this.comments?.push(comment);
				}).catch(e => { 
					this.showError(e);
				}).finally(() => {
					this.loading = false;
				});
			}
		},

		/**
		 * Show error
		 * 
		 * @param {Object} e
		 */
		showError(e) {
			this.dialog?.instance.view("error", this.sdk.errorMessage(e));
		},
	}
}