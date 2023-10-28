<template>
	<div id="app" v-if="permissions">
		<transition type="fade" v-if="loading">
			<loader :loading="loading" />
		</transition>

		<template v-else>
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
		</template>
	</div>
</template>

<style lang="sass" src="@/css/main.sass"></style>
<style src="@/assets/font-awesome/css/all.css"></style>
<script>
import loader from "@/components/loader/index.vue";

export default {
	name: "Barteron",

	components: {
		loader
	},

	data() {
		return {
			permissions: false
		}
	},

	computed: {
		/**
		 * Get user from sdk
		 * 
		 * @return {Object}
		 */
		 user() {
			return this.sdk.accounts[this.sdk.address];
		},

		/**
		 * Watch for loading state
		 * 
		 * @return {Boolean}
		 */
		loading() {
			return !this.user?.name;
		}
	},

	mounted() {
		this.sdk.requestPermissions([
			"account",
			"location"
		]).then(() => {
			this.permissions = true;
		});
	}
}
</script>