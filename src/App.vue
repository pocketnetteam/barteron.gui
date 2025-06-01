<template>
	<div
		id="app"
		:class="theme"
	>
		<v-dialog ref="dialog" />
		<div ref="lightboxContainer"></div>

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
					<keep-alive>
						<survey-bar
							v-if="isSurveyBarVisible"
						/>
					</keep-alive>

					<keep-alive include="Home">
						<router-view />
					</keep-alive>

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
import Vue from "vue";
import Loader from "@/components/loader/index.vue";
import OfferShareDialog from "@/components/barter/item/share-dialog/index.vue";
import VueI18n from "@/i18n/index.js";
import SurveyBar from "@/components/survey-bar/index.vue";
import Pinia from "@/stores/store.js";
import { mapState, mapWritableState } from "pinia";
import { default as profileStore } from "@/stores/profile.js";
import { useThemeStore } from "@/stores/theme.js";
import {
	default as LocaleStore,
	useLocaleStore
} from "@/stores/locale.js";
import { useSurveyStore } from "@/stores/survey.js";

export default {
	name: "Barteron",

	components: {
		Loader,
		SurveyBar,
		OfferShareDialog,
	},

	computed: {
		...mapState(useThemeStore, ["theme"]),
		...mapState(useLocaleStore, ["locale"]),

		...mapWritableState(useSurveyStore, ["isSurveyBarVisible"]),

		surveyDisplayInterval() {
			return 600_000;
		},
	},

	data() {
		return {
			loading: true,
			dialog: null,
			lightboxContainer: null,
			minHeaderScrollPosition: 35,
			lastScrollPosition: 0,
			lastRoute: null,
			isHeaderVisible: true,
			surveyTimerId: null,
		}
	},

	provide() {
		return {
			dialog: new Proxy({}, { get: () => this.dialog }),
			lightboxContainer: () => this.lightboxContainer,
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

			/* Load storage prefix */
			try {
				await Pinia.getPrefix();	
			} catch (e) {
				console.error(e);
			}

			/* Set language from user settings or bastyon sdk */
			this.setLanguage();

			/* Support urls from parent window */
			this.sdk.on("changestate", (data) => {
				console.log('bastyon -> barteron: ' + data, this.sdk.getRoute(data));
				this.$router.push(this.sdk.getRoute(data)).catch(e => {
					console.error(e);
				});
			});

			this.setSurveyBarVisibility();

			/* Hide preloader */
			this.loading = false;
		},

		/**
		 * Set language
		 */
		setLanguage() {
			this.$root.$i18n.locale = this.getExistingLocale(this.locale);
		},

		/**
		 * Get existing locale
		 * 
		 * @param {String} value
		 * 
		 * @returns {String}
		 */
		 getExistingLocale(value) {
			let result = value;

			if (value === LocaleStore.inheritLocale) {
				const
					language = this.sdk.appinfo?.locale,
					target = LocaleStore.list.filter(f => f.includes(language)).pop();
				
				result = target || VueI18n.fallbackLocale;
			}
			
			return result;
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
		},

		setSurveyBarVisibility() {
			if (process.env.NODE_ENV !== "production") {
				return;
			};

			this.sdk.getSurveyData().then(data => {
				const needSurvey = (data?.status === "new" && !(this.surveyTimerId));
				if (needSurvey) {
					this.surveyTimerId = setTimeout(() => {
						this.isSurveyBarVisible = true;
					}, this.surveyDisplayInterval);
				}
			}).catch(e => {
				console.error(e);
			});
		},

		showOfferShareDialog() {
			if (!(this.sdk.shareOnBastyonIsAvailable()) || profileStore.offerShareDisabled) {
				return;
			};

			var ComponentClass = Vue.extend(OfferShareDialog);
			var instance = new ComponentClass({
				propsData: {
				},
			});
			
			instance.$mount();
			this.lightboxContainer?.appendChild(instance.$el);
			this.$nextTick(() => {
				instance.show();
			});
		},
	},

	mounted() {
		/* Check if we in bastyon, redirect if needed */
		if (
			this?.sdk &&
			!this.sdk.inBastyon() &&
			this.manifest?.id &&
			!location.origin.includes("test.barter.pocketnet.app")
		) {
			let restUrl = (location.pathname + location.search + location.hash).replace("/", "");
			restUrl = (restUrl ? "&p=" + this.sdk.hexEncode(restUrl) : "");
			window.location.href = `https://bastyon.com/application?id=${ this.manifest.id }${ restUrl }`;
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

		this.$2watch("$refs.lightboxContainer").then(ref => {
			this.lightboxContainer = ref;
		}).catch(e => {
			console.error(e);
		});

		document.body.addEventListener("scroll", this.handleScroll, { passive: true });
	},

	updated() {
		this.showHeaderIfNeeded();
	},

	watch: {
		locale() {
			this.setLanguage();
		},

		"sdk.lastPublishedOfferId"() {
			this.showOfferShareDialog();
		},
	},

	destroyed() {
		document.body.removeEventListener("scroll", this.handleScroll);
	}
}
</script>