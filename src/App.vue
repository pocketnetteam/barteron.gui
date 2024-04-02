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
				<v-header :class="{ 'header-hidden': !isHeaderVisible }" />

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
import Loader from "@/components/loader/index.vue";

export default {
	name: "Barteron",

	components: {
		Loader
	},

	data() {
		return {
			loading: true,
			dialog: null,
			lastScrollPosition: 0,
			isHeaderVisible: true
		}
	},

	provide() {
		return {
			dialog: new Proxy({}, { get: () => this.dialog })
		};
	},

	methods: {
		/**
		 * Initialize app
		 */
		async setup() {
			const
				address = await this.sdk.getAddress(),
				account = await this.sdk.getBrtAccount(address);

			/* Get appInfo and bastyon profile */
			await this.sdk.getAppInfo();
			await this.sdk.getUserProfile(address);

			/* Create barteron account automatically */
			if (address && account && !account[0]) {
				account[0] = new this.sdk.models.Account({ address }).set();
			}

			/* Support urls from parent window */
			this.sdk.on("changestate", (data) => {
				console.log('bastyon -> barteron: ' + data, this.sdk.getRoute(data));
				this.$router.push(this.sdk.getRoute(data));
			});

			/* Hide preloader */
			this.loading = false;
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
		},

		/**
		 * Handle header visibility
		 */
		 handleScroll() {
			const currentScrollPosition = document.body.scrollTop;
			console.log(currentScrollPosition)

			if (currentScrollPosition > this.lastScrollPosition) {
				// Scrolling down, hide header
				this.isHeaderVisible = false;
			} else {
				// Scrolling up, show header
				this.isHeaderVisible = true;
			}
			
			this.lastScrollPosition = currentScrollPosition;
		}
	},

	mounted() {
		/* Watch for dialog */
		const interval = setInterval(() => {
			if (this.$refs.dialog) {
				clearInterval(interval);
				this.dialog = this.$refs.dialog;

				/* Sdk is unavailable */
				if (!this.sdk?.sdk) {
					this.dialog?.instance.view("error", this.$t("dialogLabels.error#-1"));
				} else {
					this.setup();
				}
			}
		}, 100);

		document.body.addEventListener("scroll", this.handleScroll, { passive: true });
	},

	destroyed() {
		document.body.removeEventListener("scroll", this.handleScroll);
	}
}
</script>