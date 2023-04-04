export default {
	name: "LanguageSwitcher",

	methods: {
		selectLanguage(item) {
			this.$refs.value.innerText = item.name;
			console.log(item)
		}
	},
}