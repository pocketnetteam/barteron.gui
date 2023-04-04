export default {
	name: "Vlightbox",

	props: {
		visible: {
			type: Boolean,
			default: false
		},
		size: String,
		header: {
			type: Boolean,
			default: true
		},
		title: String,
		closeButton: {
			type: Boolean,
			default: true
		},
		footer: {
			type: Boolean,
			default: true
		},
		overlayClickClose: {
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

		overlayClick() {
			if (this.overlayClickClose) this.hide();
		}
	}
}