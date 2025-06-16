export default {
	name: "Vdialog",

	data() {
		return {
			instance: this,
			visible: false,
			icon: false,
			iconColor: "default",
			text: "Lorem ipsum dolor sit amet consectetur",
			textColor: "default",
			buttons: []
		}
	},

	methods: {
		/**
		 * View presets
		 * 
		 * @param {String} [type]
		 * 
		 * @returns {Promise}
		 */
		view(type, props) {
			this.iconColor = type;
			this.text = props?.text || props;
			this.textColor = type;

			switch(type) {
				case "load": {
					this.icon = props?.icon || "fa-spinner fa-spin";
					this.buttons = [];
					break;
				}

				case "info": {
					this.icon = props?.icon || "fa-exclamation-circle";
					this.buttons = props?.buttons || [
						{ text: this.$t("buttonLabels.ok"), vType: "blue", vSize: "sm", click: () => this.hide(true) }
					];
					break;
				}

				case "question": {
					this.icon = props?.icon || "fa-question-circle";
					this.buttons = props?.buttons || [
						{ text: this.$t("buttonLabels.no"), vType: "blue", vSize: "sm", click: () => this.hide(false) },
						{ text: this.$t("buttonLabels.yes"), vType: "dodoria", vSize: "sm", click: () => this.hide(true) }
					];
					break;
				}

				case "success": {
					this.icon = props?.icon || "fa-check-circle";
					this.buttons = props?.buttons || [
						{ text: this.$t("buttonLabels.ok"), vType: "roshi", vSize: "sm", click: () => this.hide(true) }
					];
					break;
				}

				case "warn": {
					this.icon = props?.icon || "fa-exclamation-triangle";
					this.buttons = props?.buttons || [
						{ text: this.$t("buttonLabels.ok"), vType: "hit", vSize: "sm", click: () => this.hide(true) }
					];
					break;
				}

				case "error": {
					this.icon = props?.icon || "fa-times-circle";
					this.buttons = props?.buttons || [
						{ text: this.$t("buttonLabels.ok"), vType: "dodoria", vSize: "sm", click: () => this.hide(true) }
					];
					break;
				}
			}

			return this.show();
		},

		/**
		 * Reset to default state
		 * 
		 * @returns {Vdialog}
		 */
		reset() {
			this.icon = false;
			this.iconColor = "default";
			this.text = "Lorem ipsum dolor sit amet consectetur";
			this.textColor = "default";
			this.buttons = [];

			return this;
		},

		/**
		 * Show dialog
		 * 
		 * @returns {Promise}
		 */
		show() {
			this.visible = true;

			return new Promise((resolve, reject) => {
				this.resolve = resolve;
				this.reject = reject;
			});
		},

		/**
		 * Hide dialog
		 * 
		 * @returns {Promise}
		 */
		hide(state) {
			this.visible = false;

			return this.resolve(state);
		},

		/**
		 * Update dialog properties
		 * 
		 * @param {Object} data
		 * 
		 * @returns {Vdialog}
		 */
		update(data) {
			for (let prop in data) {
				this[prop] = data[prop];
			}

			return this;
		}
	}
}