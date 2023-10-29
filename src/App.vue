<template>
	<div id="app">
		<v-dialog ref="dialog" />

		<template v-if="permissions">
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
		 * Watch for loading state
		 * 
		 * @return {Boolean}
		 */
		 loading() {
			return !this.user?.name;
		},
		
		/**
		 * Get user from sdk
		 * 
		 * @return {Object}
		 */
		user() {
			return this.sdk.accounts[this.sdk.address];
		}
	},

	methods: {
		requestPermissions() {
			const dialog = this.$refs.dialog;

			dialog?.view("load", this.$t("dialog.check_connection"));

			this.sdk.requestPermissions([
				"account",
				"location"
			])
			.then(() => {
				this.permissions = true;
				dialog?.hide();
			});

			setTimeout(() => {
				if (!this.permissions) {
					if (dialog) {
						dialog.view("question", {
							text: this.$t("dialog.error#-1"),
							buttons: [
							{ text: this.$t("buttonLabels.no"), vType: "dodoria", vSize: "sm", click: () => dialog.hide() },
							{ text: this.$t("buttonLabels.yes"), vType: "blue", vSize: "sm", click: () => this.requestPermissions() }
							]
						});
					} else {
						this.requestPermissions();
					}
				}
			}, 5000);
		}
	},

	created() {
		this.requestPermissions();
	}
}
</script>