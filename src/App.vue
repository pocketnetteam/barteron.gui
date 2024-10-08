<template>
	<div
		id="app"
		:class="theme"
	>
		<v-dialog ref="dialog" />

		<template v-if="sdk.sdk">
			<transition
				type="fade"
				v-if="loading"
			>
				<loader :loading="loading" />
			</transition>

			<template v-if="!loading">
				<v-header 
					ref="header" 
					:class="{ 'header-hidden': !isHeaderVisible }" 
				/>

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
			minHeaderScrollPosition: 35,
			lastScrollPosition: 0,
			lastRoute: null,
			isHeaderVisible: true,
			theme: "light"
		}
	},

	provide() {
		return {
			dialog: new Proxy({}, { get: () => this.dialog }),
			switchTheme: (theme) => this.theme = theme
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
		 * Show header if needed
		 */
		 showHeaderIfNeeded() {
			if (!this.isHeaderVisible && document.body.scrollTop == 0) {
				this.setHeaderVisibility(true, { animation: false });
			}
		},

		/**
		 * Sets visibility of the header
		 * 
		 * @param {Boolean} value
		 * @param {Object} options
		 */
		setHeaderVisibility(value, options = {}) {
			if (this.isHeaderVisible != value) {
				const
					el = this.$refs.header?.$el,
					disableAnimation = !(options && options.animation);

				if (el && disableAnimation) {
					el.style.transitionDuration = '0s';
					setTimeout(() => el.style.removeProperty('transition-duration'));
				}

				this.isHeaderVisible = value;
			}
		},

		/**
		 * Handle header visibility
		 */
		 handleScroll() {
			const
				currentRoute = this.$route,
				animation = (this.lastRoute === currentRoute),
				e = document.body,
				currentScrollPosition = e.scrollTop,
				isScrollDown = currentScrollPosition > this.lastScrollPosition,
				scrollBottom = e.scrollHeight - (e.scrollTop + e.clientHeight);

			if (isScrollDown && currentScrollPosition > this.minHeaderScrollPosition) {
				this.setHeaderVisibility(false, { animation });
			} else if(!isScrollDown && scrollBottom > 0) {
				this.setHeaderVisibility(true, { animation });
			}
			
			this.lastRoute = currentRoute;
			this.lastScrollPosition = currentScrollPosition;
		}
	},

	mounted() {
		/* Check if we in bastyon, redirect if needed */
		if (
			this?.sdk &&
			!this.sdk.inBastyon() &&
			this.manifest?.id
		) {
			window.location.href = `https://bastyon.com/application?id=${ this.manifest.id }`;
		}

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

	updated() {
		this.showHeaderIfNeeded();
	},

	destroyed() {
		document.body.removeEventListener("scroll", this.handleScroll);
	}
}
</script>