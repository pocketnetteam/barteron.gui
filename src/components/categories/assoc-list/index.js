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
		 * Get image from assets
		 * 
		 * @param {String} image
		 * 
		 * @return {URL}
		 */
		imageUrl(image) {
			try {
				return require(`@/assets/images/${ image }`)
			} catch {
				return false;
			}
		}
	}
}