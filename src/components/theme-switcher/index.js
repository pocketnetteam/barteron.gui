import { mapState } from "pinia";
import {
	default as ThemeStore,
	useThemeStore
} from "@/stores/theme.js";

export default {
	name: "ThemeSwitcher",

	data() {
		return {
			themes: {
				"inherit": {
					text: "theme_inherit",
					icon: "fa-palette",
					selected: (value) => {
						return (
							this.theme === value ||
							this.theme?.includes && this.theme?.includes("inherit")
						);
					}
				},
				"light": {
					text: "theme_light",
					icon: "fa-sun"
				},
				"navy": {
					text: "theme_navy",
					icon: "fa-sun"
				},
				"dark": {
					text: "theme_dark",
					icon: "fa-moon"
				}
			}
		}
	},

	computed: {
		...mapState(useThemeStore, ["theme"]),

		/**
		 * Create list of themes
		 * 
		 * @returns {Array[Object]}
		 */
		themesList() {
			return Object.keys(this.themes).map(value => ({
				...this.themes[value],
				value,
				selected: (() => {
					const item = this.themes[value];

					if (typeof item?.selected === "function") {
						return item.selected(value);
					} else {
						return this.theme === value;
					}
				})()
			}));
		}
	},

	methods: {
		/**
		 * Set theme
		 * 
		 * @param {Object} theme
		 */
		changeTheme(theme) {
			ThemeStore.set(theme?.value);
		}
	}
}