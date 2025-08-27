import i18n from "@/i18n/index.js";

export default {
	name: "SafeDealDialog",

	i18n,

	data() {
		return {
			lightbox: false,
		}
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
	},
}