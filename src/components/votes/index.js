import Score from "@/components/score/index.vue";
import Comment from "@/components/votes/comment.vue";
import Loader from "@/components/loader/index.vue";

export default {
	name: "Votes",

	components: {
		Loader,
		Score,
		Comment
	},

	props: {
		offerInfo: {
			type: Boolean,
			default: false
		},
		compact: {
			type: Boolean,
			default: false
		},
		header: {
			type: Boolean,
			default: true
		},
		form: {
			type: Boolean,
			default: false
		},
		item: {
			type: Object,
			default: () => ({})
		},
	},

	data() {
		return {
			isOfferScoreConfirm: false,
			isOfferScoreLoading: false,
			isCommentLoading: false,
			score: 0,
		}
	},

	inject: ["dialog"],

	computed: {
		details() {
			return this.sdk.barteron.details[this.item?.hash];
		},

		offerScores() {
			return this.details?.offerScores || [];
		},

		comments() {
			return this.details?.comments || [];
		},

		offerExists() {
			return (this.item?.hash?.length >= 64);
		},
	},

	methods: {
		addPendingActions() {
			this.sdk.getVoteActions().then(actions => {
				(actions || []).forEach(action => {
					const
						forThisOffer = (
							(action.expObject.type === "upvoteShare" 
								&& action.expObject.share === this.item?.hash)
							|| (action.expObject.type === "comment" 
								&& action.expObject.postid === this.item?.hash)
						),
						isValid = action.transaction,
						isRelay = !(action.completed || action.rejected);
	
					if (forThisOffer && isValid && isRelay) {
						if (action.expObject.type === "upvoteShare" && !(this.hasRelayOfferScore())) {
							const element = this.createRelayOfferScore(action);
							this.score = element.value;
							this.offerScores.push(element);
						} else if (action.expObject.type === "comment" && !(this.hasRelayComment())) {
							const element = this.createRelayComment(action);
							this.comments.push(element);
						}
					}
				});

			});
		},

		createRelayOfferScore(action) {
			return new this.sdk.models.OfferScore({
				hash: action.transaction,
				offerId: action.expObject.share,
				address: this.sdk.address,
				value: action.expObject.value,
				relay: true,
			});
		},

		createRelayComment(action) {
			return new this.sdk.models.Comment({
				hash: action.transaction,
				postid: action.expObject.postid,
				parentid: action.expObject.parentid,
				address: this.sdk.address,
				message: action.expObject.msgparsed?.message,
				info: action.expObject.msgparsed?.info,
				relay: true,
			});
		},

		/**
		 * Vote event
		 * 
		 * @param {Number} score
		 */
		voteEvent(score) {
			this.score = score;
			this.isOfferScoreConfirm = true;
			this.dialog?.instance
				.view("question", this.$t("dialogLabels.submit_rating"))
				.then(state => {
					this.isOfferScoreConfirm = false;
					if (state) {
						this.vote(score);
					} else {
						this.score = 0;
						this.$refs.offerScore?.reset();
					}
				});
		},

		/**
		 * Store vote
		 * 
		 * @param {Number} score
		 */
		vote(score) {
			if (!(this.isOfferScoreLoading)) {
				this.isOfferScoreLoading = true;
				this.score = score;
				this.removeRejectedOfferScores();
	
				this.sdk.setBrtOfferVote({
					offerId: this.item.hash,
					address: this.item.address,
					value: score
				}).then((action) => {
					const element = this.createRelayOfferScore(action);
					this.offerScores.push(element);
				}).catch(e => {
					this.score = 0;
					this.$refs.offerScore?.reset();
					this.showError(e);
				}).finally(() => {
					this.isOfferScoreLoading = false;
				});
			}
		},

		/**
		 * Event of comment submitting
		 */
		submitCommentEvent() {
			this.dialog?.instance
				.view("question", this.$t("dialogLabels.submit_comment"))
				.then(state => {
					if (state) {
						this.submitComment();
					}
				});
		},

		/**
		 * Send comment
		 */
		submitComment() {
			const
				form = this.$refs.form,
				feed = this.$refs.vote,
				formData = form.serialize();

			if (form.validate() && !this.isCommentLoading) {
				this.isCommentLoading = true;
				this.removeRejectedComments();

				this.sdk.setBrtComment({
					postid: this.item.hash,
					msgparsed: {
						message: formData.vote,
						info: this.score?.toFixed() || ""
					}
				}).then((action) => {
					const element = this.createRelayComment(action);
					feed.content = "";
					this.comments.push(element);
					this.score = 0;
				}).catch(e => { 
					this.showError(e);
				}).finally(() => {
					this.isCommentLoading = false;
				});
			}
		},

		// when user clicked back button in browser and then forward button 
		// during offer score in relay state
		restoreScoreValueIfNeeded() {
			const element = this.getRelayOfferScore();
			if (element) {
				this.score = element.value;
			}
		},

		starsValue() {
			return (this.hasRelayOfferScore() 
				|| this.isOfferScoreLoading 
				|| this.isOfferScoreConfirm) ? this.score : null;
		},

		completedOfferScoresAverage() {
			const items = this.offerScores.filter(f => f.completed);
			return items.reduce((a, v) => {
				return a += v?.value;
			}, 0) / (items.length || 1);
		},

		hasRelayOfferScore() {
			return this.offerScores.some(f => f.relay);
		},

		getRelayOfferScore() {
			return this.offerScores.filter(f => f.relay).pop();
		},

		hasRejectedOfferScore() {
			return this.offerScores.some(f => f.rejected);
		},

		removeRejectedOfferScores() {
			const removingItems = this.offerScores.filter(f => f.rejected);
			removingItems.forEach(element => {
				const index = this.offerScores.indexOf(element);
				this.offerScores.splice(index, 1);
				element.destroy();
			})
		},

		offerScoresCount() {
			return this.offerScores.filter(f => f.completed).length;
		},

		voteable() {
			return this.offerExists 
				&& this.form
				&& !(this.offerScores.some(f => f.address === this.sdk.address && (f.relay || f.completed))
					|| this.isOfferScoreLoading
					|| this.isOfferScoreConfirm);
		},

		validComments() {
			return this.comments.filter(f => !(f.rejected));
		},

		hasRelayComment() {
			return this.comments.some(f => f.relay);
		},

		hasRejectedComment() {
			return this.comments.some(f => f.rejected);
		},

		removeRejectedComments() {
			const removingItems = this.comments.filter(f => f.rejected);
			removingItems.forEach(element => {
				const index = this.comments.indexOf(element);
				this.comments.splice(index, 1);
				element.destroy();
			})
		},

		commentable() {
			return this.offerExists && this.form;
		},
	},

	mounted() {
		this.restoreScoreValueIfNeeded();
		this.addPendingActions();
	},
}