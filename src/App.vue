<template>
	<div id="app">
		<v-header />

		<section id="main">
			<router-view />
			<div id="container">
				<router-view name="aside" />
				<router-view name="content" />
				<router-view name="sidebar" />
			</div>
		</section>

		<v-footer />
	</div>
</template>

<style lang="sass" src="@/css/main.sass"></style>
<style src="@/assets/font-awesome/css/all.css"></style>
<script>
import favoritesData from "@/data/favorites.json";

export default {
	name: "Barteron",

	provide() {
		return {
			favorite: favoritesData
		}
	},

	mounted() {
		Promise.all([
			/* Account */
			this.sdk.getUserInfo(),

			/* Location */
			this.sdk.getLocation()
		]).then(() => {
			console.warn('sdk loaded');
		});
	},
}
</script>