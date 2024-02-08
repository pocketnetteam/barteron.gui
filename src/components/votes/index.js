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
		offerId: String
	},

	data() {
		return {
			loading: false
		}
	},

	methods: {
		submit() {
			const
				form = this.$refs.form,
				feed = this.$refs.feedback,
				data = form.serialize();

			if (form.validate()) {
				this.loading = true;

				new this.sdk.models.Comment({
					postid: this.offerId,
					message: data.feedback
				}).set().then(() => {
					this.loading = false;
					feed.content = "";
				});
			}
		}
	}
}