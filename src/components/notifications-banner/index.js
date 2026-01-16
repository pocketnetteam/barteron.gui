// TODO: i18n, appBanner need remove

import { TelegramManager } from "@/js/notificationUtils.js";
import Loader from "@/components/loader/index.vue";
import Vue from 'vue';
import i18n from "@/i18n/index.js";
import {
	default as profileStore,
} from "@/stores/profile.js";

export default {
	name: "NotificationsBanner",

	i18n,

	components: {
		Loader,
	},

	data() {
		return {
			lightbox: false,
			activeIndexes: {
				0: true,
				1: true,
			},
			telegramData: {
				currentState: "",
			},
			notificationsBannerDisabled: false,
		}
	},

	props: {
		viewMode: {
			type: String,
			default: "banner"
		},
	},

	computed: {
		i18nPlatformKey() {
			let result = "";

			switch (this.sdk.appinfo?.device) {
				case "browser":
					result = "web";
					break;

				case "application_electron":
					result = "desktop";
					break;

				case "application_ios", "application_android":
					result = "mobile";
					break;
					
				default:
					break;
			};

			return result;
		},

		telegramBotLink() {
			return TelegramManager.telegramBotLink;
		},
	},

	methods: {
		show() {
			this.lightbox = true;
			this.$emit("onShow", this);
		},

		hide() {
			this.lightbox = false;
			setTimeout(() => {
				this.$emit("onHide", this);
				this.remove();
			}, 300);
		},

		remove() {
			this.$destroy();
			this.$el.parentNode.removeChild(this.$el);			
		},

		toggle(index) {
			const value = this.activeIndexes[index];
			Vue.set(this.activeIndexes, index, !(value));
		},

		enter(el) {
			// el.style.height = '0px'
			// el.style.opacity = 0
			// el.style.paddingTop = '0px'
			// el.style.paddingBottom = '0px'

			// const height = el.scrollHeight + 'px'
			// el.offsetHeight // forced reflow

			// el.style.transition = 'height 0.3s ease, opacity 0.3s ease, padding 0.3s ease'
			// el.style.height = height
			// el.style.opacity = 1
			// el.style.paddingTop = ''
			// el.style.paddingBottom = ''

			el.style.height = '0';
			el.style.opacity = '0';
			el.style.overflow = 'hidden';

			const height = el.scrollHeight + 'px';

			el.offsetHeight; // reflow

			el.style.transition = 'height 0.3s ease, opacity 0.3s ease';
			el.style.height = height;
			el.style.opacity = '1';
		},

		afterEnter(el) {
			el.style.height = 'auto';
			el.style.overflow = '';
			el.style.transition = '';
		},

		leave(el) {
			// el.style.height = el.scrollHeight + 'px'
			// el.offsetHeight // forced reflow

			// el.style.transition = 'height 0.3s ease, opacity 0.3s ease, padding 0.3s ease'
			// el.style.height = '0px'
			// el.style.opacity = 0
			// el.style.paddingTop = '0px'
			// el.style.paddingBottom = '0px'

			el.style.height = el.scrollHeight + 'px';
			el.style.opacity = '1';
			el.style.overflow = 'hidden';

			el.offsetHeight; // reflow

			el.style.transition = 'height 0.3s ease, opacity 0.3s ease';
			el.style.height = '0';
			el.style.opacity = '0';
		},

		openAppsLink() {
			this.sdk.openExternalLink(this.appsLink);
		},

		notificationsBannerDisabledChange(value, e) {
			profileStore.notificationsBannerDisabled = e.target.checked;
			profileStore.saveState();
		},

		loadTelegramData() {
			this.telegramData = {
				currentState: "loading",
			};

			const telegramManager = new TelegramManager();
			telegramManager.getSubscription(this.address).then(data => {
				if (data?.subscription) {
					this.telegramData = {
						currentState: "connected",
						stateData: data?.subscription,
					}
				} else {
					this.telegramData = {
						currentState: "disconnected",
					}
				}
			}).catch(e => {
				console.error(e);
				this.telegramData = {
					currentState: "error",
					stateData: {
						error: e,
					},
				};
			});
		},

		telegramLoadingError() {
			let result = "";
			if (this.telegramData?.currentState === "error") {
				result = this.telegramData?.stateData?.error?.message;
			}
			return result;
		},

		openTelegramBotLink() {
			this.sdk.openExternalLink(this.telegramBotLink);
		},

		connectTelegramBot() {
			const username = (this.$refs.telegramUsername.inputs[0].value || "").trim();
			if (username) {
				const data = {
					address: this.address,
					telegram: username,
					isEnabled: true,
				};

				this.telegramData = {
					currentState: "loading",
				};

				const telegramManager = new TelegramManager();
				telegramManager.createSubscription(data).then(() => {
					this.telegramData = {
						currentState: "connected",
					}
				}).catch(e => {
					console.error(e);
					this.telegramData = {
						currentState: "error",
						stateData: {
							error: e,
						},
					};
				});
			} else {
				this.$refs.dialog?.instance.view(
					"error", 
					this.$t("dialogLabels.telegram_username_undefined")
				);
			};
		},

		disconnectTelegramBotEvent() {
			this.$refs.dialog?.instance
				.view("question", this.$t("dialogLabels.disconnecting_telegram_bot"))
				.then(state => {
					if (state) {
						this.disconnectTelegramBot();
					}
				});

		},

		disconnectTelegramBot() {
			this.telegramData = {
				currentState: "loading",
			};

			const telegramManager = new TelegramManager();
			telegramManager.removeSubscription(this.address).then(() => {
				this.telegramData = {
					currentState: "disconnected",
				}
			}).catch(e => {
				console.error(e);
				this.telegramData = {
					currentState: "error",
					stateData: {
						error: e,
					},
				};
			});
		},
	},

	mounted() {
		this.loadTelegramData();
	},
}