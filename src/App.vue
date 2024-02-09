<template>
	<div id="app">
		<v-dialog ref="dialog" />

		<template v-if="sdk.sdk">
			<transition
				type="fade"
				v-if="loading"
			>
				<loader :loading="loading" />
			</transition>

			<template v-if="!loading">
				<v-header />

				<section id="main">
					<router-view />

					<div
						id="container"
						v-if="hasComponents(['aside', 'content', 'sidebar'])"
					>
						<router-view
							name="aside"
							v-if="hasComponents(['aside'])"
						/>
						<router-view
							name="content"
							v-if="hasComponents(['content'])"
						/>
						<router-view
							name="sidebar"
							v-if="hasComponents(['sidebar'])"
						/>
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
			loading: true,
			dialog: null
		}
	},

	provide() {
		return {
			dialog: new Proxy({}, { get: () => this.dialog })
		};
	},

	methods: {
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

	async mounted() {
		const
			address = await this.sdk.getAddress(),
			account = await this.sdk.getBrtAccount(address);

		/* Get appInfo and bastyon profile */
		await this.sdk.getAppInfo();
		await this.sdk.getUserProfile(address);

		/* Create barteron account automatically */
		if (address && !account?.[0]) {
			account[0] = new this.sdk.models.Account({ address }).set();
		}

		/* Support urls from parent window */
		this.sdk.on("changestate", ({ route }) => {
			console.log('bastyon -> barteron: ' + route)
			this.$router.push({ path: route });
		});

		/* Watch for dialog */
		const interval = setInterval(() => {
			if (this.$refs.dialog) {
				clearInterval(interval);
				this.dialog = this.$refs.dialog;

				/* Sdk is unavailable */
				if (!this.sdk.sdk) {
					this.dialog?.view("error", this.$t("dialogLabels.error#-1"));
				}
			}
		}, 100);

		/* Hide preloader */
		this.loading = false;
	}
}
</script>