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
			detailsAreLoading: false,
			isLoading: false,
			score: 0,
			offerScores: [],
			comments: [],
		}
	},

	inject: ["dialog"],

	methods: {
		loadData() {
			const details = this.sdk.barteron.details[this.item?.hash];
			if (details instanceof Promise) {
				this.detailsAreLoading = true;
				details.then((rawData) => {
					console.log('[[[[[[[[[[[[ rawData', rawData);
					
					const loadedDetails = this.sdk.barteron.details[this.item?.hash];
					this.loadFeedbackItems(loadedDetails);
				}).catch(e => {
					console.error(e);
				}).finally(() => {
					this.detailsAreLoading = false;
				});
			} else {
				this.loadFeedbackItems(details);
			}
		},

		loadFeedbackItems(details) {
			console.log('loadFeedbackItems(details)', details);
			
			this.offerScores = Object.values(details?.offerScores || {});
			this.comments = Object.values(details?.comments || {});

			console.log('loaded offerScores', this.offerScores);
			console.log('loaded comments', this.comments);

			this.addPendingActions();
		},

		addPendingActions() {
			this.sdk.getFeedbackActions().then(actions => {
				actions.forEach(action => {
					console.log('before create feedback element, action = ', action);
					
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
							console.log('after create OfferScore, action = ', action);
						} else if (action.expObject.type === "comment" && !(this.hasRelayComment())) {
							const element = this.createRelayComment(action);
							this.comments.push(element);
							console.log('after create Comment, action = ', action);
						}
					}
				});
			});
		},

		createRelayOfferScore(action) {
			return new this.sdk.models.OfferScore({
				hash: action.transaction,
				offerId: action.expObject.share,
				address: action.expObject.vsaddress,
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
		 * Store vote
		 * 
		 * @param {Number} score
		 */
		vote(score) {
			if (!this.isLoading) {
				this.removeRejectedOfferScores();
				this.isLoading = true;
	
				this.sdk.setBrtOfferVote({
					offerId: this.item.hash,
					address: this.item.address,
					value: score
				}).then((action) => {
					console.log('setBrtOfferVote action', action);
	
					const element = this.createRelayOfferScore(action);
					this.score = score;
					this.offerScores.push(element);
				}).catch(e => {
					this.score = 0;
					this.showError(e);
				}).finally(() => {
					this.isLoading = false;
				});
			}
		},

		/**
		 * Send comment
		 */
		submit() {
			const
				form = this.$refs.form,
				feed = this.$refs.vote,
				formData = form.serialize();

			if (form.validate() && !this.isLoading) {
				this.removeRejectedComments();
				this.isLoading = true;

				/* Send comment to node */
				this.sdk.setBrtComment({
					postid: this.item.hash,
					msgparsed: {
						message: formData.vote,
						info: this.score?.toFixed() || ""
					}
				}).then((action) => {
					console.log('=================== comment action', action);

					const element = this.createRelayComment(action);
					console.log('=================== comment element', element);
					feed.content = "";
					this.score = 0;
					this.comments.push(element);
				}).catch(e => { 
					this.showError(e);
				}).finally(() => {
					this.isLoading = false;
				});
			}
		},

		offerScoresAverage() {
			const items = this.offerScores.filter(f => f.completed);
			return items.reduce((a, v) => {
				return a += v?.value;
			}, 0) / (items.length || 1);
		},

		hasRelayOfferScore() {
			return this.offerScores.some(f => f.relay);
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
			return this.form
				&& !this.offerScores.some(f => f.address === this.sdk.address);
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
			return this.form 
				&& !this.comments.some(f => f.address === this.sdk.address);
		},
	},

	mounted() {
		this.loadData();
		this.sdk.on("action", action => console.log('this.sdk.on action', action));
	},

	// TODO: add text for all error code !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!



}