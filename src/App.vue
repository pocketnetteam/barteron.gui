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
					<div id="container" v-if="hasComponents(['aside', 'content', 'sidebar'])">
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
			permissions: false,
			dialog: null
		}
	},

	computed: {
		/**
		 * Watch for loading state
		 * 
		 * @returns {Boolean}
		 */
		 loading() {
			return !this.user?.name;
		},
		
		/**
		 * Get user from sdk
		 * 
		 * @returns {Object}
		 */
		user() {
			return this.sdk.accounts[this.sdk.address];
		}
	},

	methods: {
		/**
		 * Request permissions through bastyon dialog
		 * 
		 * @returns {Void}
		 */
		requestPermissions() {
			const dialog = this.dialog;

			dialog?.view("load", this.$t("dialog.checking_connection"));

			setTimeout(() => {
				if (!this.permissions) {
					if (dialog) {
						dialog.view("question", {
							text: this.$t("dialog.error#-2"),
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
		},


		/**
		 * Check is components includes given names
		 * 
		 * @param {Array} names
		 * 
		 * @returns {Boolean}
		 */
		hasComponents(names) {
			return Object.keys(this.$route.matched?.[0]?.components ?? {}).some(name => {
				return names.includes(name);
			});
		}
	},

	mounted() {
		if (this.sdk.sdk) {
			this.sdk.requestPermissions([
				"account",
				"location"
			])
			.then(() => {
				this.permissions = true;
				this.dialog?.hide();
			});

			this.requestPermissions();
		}

		/* Watch for dialog */
		const interval = setInterval(() => {
			if (this.$refs.dialog) {
				clearInterval(interval);
				this.dialog = this.$refs.dialog;

				if (!this.sdk.sdk) {
					this.dialog?.view("error", this.$t("dialog.error#-1"));
				}
			}
		}, 100);
	}
}
</script>