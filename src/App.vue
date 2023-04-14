<template>
	<div id="app">
		<Header />

		<section id="main">
			<router-view />
			<div id="container">
				<router-view name="aside" />
				<router-view name="content" />
				<router-view name="sidebar" />
			</div>
		</section>

		<Footer />
	</div>
</template>

<style lang="sass" src="@/css/main.sass"></style>
<style src="@/assets/font-awesome/css/all.css"></style>
<script>
import Categories from "@/js/categories.js"
import Header from "@/components/layout/header/index.vue";
import Footer from "@/components/layout/footer/index.vue";

import categoriesData from "@/data/categories.json";
import favoritesData from "@/data/favorites.json";

export default {
	name: "Barteron",

	components: {
		Header,
		Footer
	},

	provide() {
		return {
			categories: this.categories,
			favorite: favoritesData
		}
	},

	computed: {
		categories() {
			return new Categories(categoriesData);
		}
	}
}
</script>