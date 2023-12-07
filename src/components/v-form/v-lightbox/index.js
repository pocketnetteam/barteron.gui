export default {
	name: "Vlightbox",

	props: {
		visible: {
			type: Boolean,
			default: false
		},
		size: String,
		title: String,
		close: {
			type: Boolean,
			default: true
		},
		overlayClick: {
			type: Boolean,
			default: true
		}
	},

	data() {
		return {
			active: this.visible
		}
	},

	watch: {
		visible(value) {
			this.active = value;
		}
	},

	methods: {
		show() {
			this.active = true;
			this.$emit("onShow", this);
		},

		hide() {
			this.active = false;
			this.$emit("onHide", this);
		},

		overlay() {
			if (this.overlayClick) this.hide();
		}
	}
}