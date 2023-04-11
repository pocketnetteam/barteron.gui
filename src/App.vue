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
import Categories from "@/js/categories.js"
import categoriesData from "@/data/categories.json";
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
			categories: this.categories
		}
	},

	data() {
		return {

		}
	},

	computed: {
		categories() {
			return new Categories(categoriesData);
		}
	}
}
</script>