import Feedback from "@/components/feedback/index.vue";
import LanguageSwitcher from "@/components/language-switcher/index.vue";

export default {
	name: "Footer",

	components: {
		Feedback,
		LanguageSwitcher
	},

	computed: {
		/**
		 * Calculate current year
		 * if current year greater than
		 * creation year
		 * 
		 * @returns {String}
		 */
		getYear() {
			const
				created = 2023,
				current = new Date().getFullYear();

			if (current > created) {
				return `${ created } — ${ current }`;
			} else {
				created.toString();
			}
		}
	}
}