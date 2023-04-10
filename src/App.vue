<template>
	<div id="app">
		<Header />

		<div id="main">
			<router-view />
			<div id="container">
				<router-view name="aside" />
				<router-view name="content" />
				<router-view name="sidebar" />
			</div>
		</div>

		<Footer />
	</div>
</template>

<style lang="sass" src="@/css/main.sass"></style>
<style src="@/assets/font-awesome/css/all.css"></style>
<script>
import categories from "@/data/categories.json";
import Header from "@/components/layout/header/index.vue";
import Footer from "@/components/layout/footer/index.vue";

export default {
	name: "Barteron",

	components: {
		Header,
		Footer
	},

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
				iterate = (items, parentId) => {
					items.forEach(item => {
						map[item.id] = { name: item.name, parent: parentId ?? null, children: item.children.map(children => children.id) };

						if (item.children?.length) {
							iterate(item.children, item.id);
						}
					});
				}

			iterate(categories ?? []);

			return map;
		}
	}
}
</script>