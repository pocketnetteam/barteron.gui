import { mapState } from "pinia";
import {
	default as ThemeStore,
	useThemeStore
} from "@/stores/theme.js";
import {
	default as LocaleStore,
	useLocaleStore
} from "@/stores/locale.js";
import VueI18n from "@/i18n/index.js";

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
					icon: "fa-moon"
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

		...mapState(useLocaleStore, ["locale"]),

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
		},

		dropdownList() {
			return this.themesList.map(theme => ({
				...theme,
				text: `
				<i class='fa ${ theme.icon }'></i>
				${ VueI18n.t(`themeLabels.${ theme.value }`) }
				`
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
		},

		htmlContent() {
			let value = this.theme;
			if (this.theme?.includes && this.theme?.includes("inherit")) {
				value = value.split(" ")[1];
			};
			const item = this.dropdownList.filter(f => f.value === value).pop();
			return (item || this.dropdownList[0]).text;
		},
	},

	watch: {
		locale() {
			this.$refs.theme?.updateButton();
		}
	}
}