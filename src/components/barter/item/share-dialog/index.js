import i18n from "@/i18n/index.js";
import ImageLoad from "@/components/image-load/index.vue";
import Loader from "@/components/loader/index.vue";
import {
	default as profileStore,
} from "@/stores/profile.js";

export default {
	name: "OfferShareDialog",

	components: {
		ImageLoad,
		Loader,
	},

	i18n,

	data() {
		return {
			lightbox: false,
			offerShareDisabled: false,
		}
	},

	computed: {
		item() {
			const offerId = this.sdk.lastPublishedOfferId;
			return this.sdk.barteron.offers[offerId];
		},

		images() {
			return (this.item.images || []).map(url => this.sdk.manageBastyonImageSrc(url));
		},
	},

	methods: {
		show() {
			this.lightbox = true;
			this.$emit("onShow", this);
		},

		hide() {
			this.lightbox = false;
			setTimeout(() => {
				this.$emit("onHide", this);
				this.remove();
			}, 300);
		},

		remove() {
			this.$destroy();
			this.$el.parentNode.removeChild(this.$el);			
		},

		offerShareDisabledChange(value, e) {
			profileStore.offerShareDisabled = e.target.checked;
			profileStore.saveState();
		},

		shareOnBastyon() {
			const 
				data = {
					hash: this.item.hash,
					caption: this.item.caption,
					images: this.images,
				},
				options = { shareOnBastyon: true };

			this.sdk.share(data, options).then(success => {
				if (success) {
					setTimeout(() => {
						this.hide();
					}, 500);			
				};
			});
		},
	},
}