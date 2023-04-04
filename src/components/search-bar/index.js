import Categories from "@/components/categories/index.vue";

export default {
	name: "SearchBar",

	inject: ["categories"],

	components: {
		Categories
	},

	methods: {
		categorySelected(item, button) {
			console.log(item, button)
		}
	},
}