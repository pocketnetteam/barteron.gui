/* import ThemeStore from "@/stores/locale.js"; */

export default {
	name: "ThemeSwitcher",

	inject: ["switchTheme"],

	data() {
		return {
			themes: {
				"light": {
					text: "theme_light",
					icon: "fa-sun"
				},
				"dark": {
					text: "theme_dark",
					icon: "fa-moon"
				}
			},
			theme: "light"
		}
	},

	computed: {
		/**
		 * Create list of themes
		 * 
		 * @returns {Array[Object]}
		 */
		themesList() {
			return Object.keys(this.themes).map(value => ({
				...this.themes[value],
				value,
				default: this.theme === value
			}));
		},

		/**
		 * Get current theme
		 * 
		 * @returns {Object}
		 */
		currentTheme() {
			return this.themes[this.theme];
		}
	},

	methods: {
		/**
		 * Select theme
		 * 
		 * @param {Object} theme
		 */
		selectTheme(theme) {
			this.theme = theme.value;
			this.switchTheme(theme.value);
		}
	},

	created() {
		// if (ThemeStore?.theme) {
		// 	/* Get theme from store */
		// 	this.selectLanguage(ThemeStore.theme);
		// } else if (this.sdk.appinfo) {
		// 	/* Get theme from bastyon */
		// 	this.switchTheme(this.sdk.appinfo?.theme);
		// }
	}
}