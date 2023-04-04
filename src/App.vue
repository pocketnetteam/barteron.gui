<template>
	<div id="app">
		<Header />

		<div id="main">
			<router-view name="aside" />
			<router-view />
			<router-view name="sidebar" />
		</div>

		<Footer />
	</div>
</template>

<style lang="sass" src="@/css/main.sass"></style>
<style src="@/assets/font-awesome/css/all.css"></style>
<script>
import categories from "@/data/categories.json";
import Header from "@/components/header/index.vue";
import Footer from "@/components/footer/index.vue";
import item from "./components/barter/item";

export default {
	name: "Barteron",

	provide() {
		return {
			categories,
			categoriesMap: this.categoriesMap
		}
	},

	data() {
		return {

		}
	},

	computed: {
		categoriesMap() {
			const
				map = {},
				iterate = (items) => {
					items.forEach(item => {
						map[item.id] = item.name;

						if (item.children?.length) {
							iterate(item.children);
						}
					});
				}

			if (categories?.length) {
				iterate(categories);
			}

			return map;
		}
	},

	components: {
		Header,
		Footer
	}
}
</script>