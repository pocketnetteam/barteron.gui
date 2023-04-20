export default {
	name: "Vinput",

	props: {
		id: [String, Array],
		name: [String, Array],
		type: [String, Array],
		value: [String, Array]
	},

	methods: {
		/**
		 * Convert String to Array
		 * 
		 * @param {String} param
		 */
		toArray(param) {
			return (typeof param === "string" ? [param] : Array.isArray(param) ? param : []);
		}
	}
}