export default {
	name: "Vtextarea",

	props: {
		id: String,
		name: String,
		readonly: Boolean,
		placeholder: String,
		value: String,
		resize: String,
		length: String,
		vSize: String
	},

	data() {
		return {
			content: null,
			count: 0
		}
	},

	methods: {
		trimContent() {
			if (this.content) {
				this.content = this.content.trim();
			}
		},
	},

	mounted() {
		this.content = this.value ?? "";
	},

	watch: {
		/**
		 * Watch on text length and adjust height
		 * 
		 * @param {String} val 
		 */
		content(val) {
			if (this.length && val.length > this.length) {
				this.content = val.substring(0, this.length);
			}

			this.count = val.length;

			this.$emit("contentChanged");
			
			this.$nextTick(() => {
				const textarea = this.$refs.textarea;

				textarea.style.height = "1px";
				textarea.style.height = (textarea.scrollHeight) + "px";
			});
		},

		value(val) {
			this.content = val;
		}
	}
}