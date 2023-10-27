export default {
	name: "Vform",

	props: {
		fields: {
			type: String,
			default: "*[name]"
		},
		classes: {
			type: Object,
			default: () => ({
				parent: ".field",
				passed: "passed",
				rejected: "rejected"
			})
		},
		rules: {
			type: Object,
			default: () => ({
				"input[name], textarea[name]": {
					empty: true, /* Validate for emptity */
					regex: false, /* Validate with regex */
					value: "value" /* Check field prop */
				}
			})
		}
	},

	data() {
		return {
			form: this,
			valid: []
		}
	},

	computed: {
		dialog() {
			return this.$refs.dialog;
		}
	},

	methods: {
		/**
		 * Validate fields with rules
		 */
		validate() {
			const form = this.$refs.form;
			this.valid = [];

			Object.keys(this.rules).forEach(fields => {
				const rule = this.rules[fields];

				Array.from(
					form.querySelectorAll(fields)
				).forEach(field => {
					const parent = field.closest(this.classes.parent), valid = {};

					if (parent) {
						parent.classList.remove(this.classes.passed, this.classes.rejected);

						/* Rules */
						if (rule.empty) {
							valid.empty = rule.empty && !!field[rule.value];
						}
	
						if (rule.regex) {
							valid.regex = rule.regex && !!(new RegExp(rule.regex)).test(field[rule.value]);
						}
	
						/* Add class to parent */
						if (Object.values(valid).includes(false)) {
							parent.classList.add(this.classes.rejected);
							this.valid.push(false);
						} else {
							parent.classList.add(this.classes.passed);
							this.valid.push(true);
						}
					}
				});
			});

			return !Object.values(this.valid).includes(false);
		},

		/**
		 * Serialize form data
		 * 
		 * @return {Object}
		 */
		serialize() {
			return Object.fromEntries(new FormData(this.$refs.form).entries());
		}
	}
}