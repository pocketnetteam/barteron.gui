export default {
	name: "Vinput",

	props: {
		id: { type: [String, Array], default: () => [] },
		name: { type: [String, Array], default: () => [] },
		type: { type: [String, Array], default: () => [] },
		readonly: { type: [String, Array], default: () => [] },
		min: { type: [Number, String, Array], default: () => [] },
		max: { type: [Number, String, Array], default: () => [] },
		placeholder: { type: [String, Array], default: () => [] },
		list: { type: [String, Array], default: () => [] },
		value: { type: [Number, String, Array], default: () => [] },
		
		vEvents: { type: Object, default: () => ({}) },
		vSize: String,
	},

	data() {
		return {
			inputs: [],
			exclude: ["vEvents", "vSize"]
		}
	},

	computed:{
		/**
		 * Make object with inputs attributes
		 * 
		 * @returns {Object[]}
		 */
		attrs() {
			const data = Object.keys(this.$props).filter(e => !this.exclude.includes(e));

			return this.getAttrs(
				data,
				data.map(prop => this.$props[prop])
			);
		}
	},

	methods: {
		/**
		 * Convert String to Array
		 * 
		 * @param {String} param
		 * 
		 * @returns {Array}
		 */
		toArray(param) {
			return Array.isArray(param) ? param : [param];
		},

		/**
		 * Build input list from props
		 * 
		 * @param {Array} inputs
		 * 
		 * @returns {Object}
		 */
		getAttrs(keys, values) {
			const props = keys.reduce((o, p) => {
				o[p] = this.toArray(this[p]);

				return o;
			}, {});

			return values
				.map(m => this.toArray(m))
				.sort((a, b) => a.length > b.length ? -1 : (a.length < b.length ? 1 : 0))[0]
				.reduce((a, v, i) => {
					a.push(
						/* Generate input keys */
						keys.reduce((o, k) => {
							if (k === "type") o[k] = this.getType(props[k][i] ?? props[k][props[k].length - 1]);
							else if (["min", "max"].includes(k)) o[k] = props[k][i] ?? props[k][props[k].length - 1];
							else o[k] = props[k][i] ?? null
	
							return o;
						}, {})
					);

					return a;
				}, []);
		},

		/**
		 * Get input type
		 * 
		 * @param {String}
		 * 
		 * @returns {String}
		 */
		getType(type) {
			switch(type) {
				case "minmax": return "number";
				default: return type;
			}
		}
	},

	mounted() {
		/* Create real-time computed property */
		this.inputs = new Proxy(this.$refs.fields, {
			get(target, index) {
				return target?.[index];
			}
		});
	}
}