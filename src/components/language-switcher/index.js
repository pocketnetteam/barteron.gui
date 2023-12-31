export default {
	name: "LanguageSwitcher",

	methods: {
		selectLanguage(item) {
			this.$root.$i18n.locale = item.value;
		}
	}
}