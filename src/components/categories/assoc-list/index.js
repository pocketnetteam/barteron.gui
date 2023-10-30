import { Object } from "core-js";

export default {
	name: "AssocList",

	props: {
		items: {
			type: Object,
			default: () => {}
		}
	},

	methods: {
		/**
		 * Get absolute path from path
		 * 
		 * @param {String} path
		 * 
		 * @returns {String}
		 */
		imageUrl(path) {
			if (["http", "data:image"].some(str => path?.startsWith(str))) {
				return path;
			} else {
				try {
					return require(`@/assets/images/${ path }`)
				} catch {
					return null;
				}
			}
		}
	}
}