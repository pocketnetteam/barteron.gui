import ThemeStore from "@/stores/theme.js";

export default {
	name: "ThemeSwitcher",

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
				selected: this.theme === value
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
		 * @param {Object|String} theme
		 */
		selectTheme(theme) {
			this.theme = theme?.value || theme;
		},

		/**
		 * Set theme
		 * 
		 * @param {Object} theme
		 */
		changeTheme(theme) {
			this.selectTheme(theme);
			ThemeStore.set(this.theme);
		}
	},

	created() {
		this.selectTheme(ThemeStore.theme);
	}
}