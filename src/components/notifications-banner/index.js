import { TelegramManager, VKManager } from "@/js/notificationUtils.js";
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
			activeIndexes: {},
			telegramNotificationsAllowed: false,
			telegramData: {
				currentState: "",
			},
			vkNotificationsAllowed: false,
			vkData: {
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
		offerHasBeenPublished: {
			type: Boolean,
			default: false
		}
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
			return TelegramManager.botLink;
		},

		vkBotLink() {
			return VKManager.botLink;
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
			this.activeIndexes = { [index]: !(value) };
		},

		enter(el) {
			el.style.height = '0';
			el.style.opacity = '0';
			el.style.overflow = 'hidden';

			const height = el.scrollHeight + 'px';

			el.offsetHeight; // forced reflow

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
			el.style.height = el.scrollHeight + 'px';
			el.style.opacity = '1';
			el.style.overflow = 'hidden';

			el.offsetHeight; // forced reflow

			el.style.transition = 'height 0.3s ease, opacity 0.3s ease';
			el.style.height = '0';
			el.style.opacity = '0';
		},

		notificationsBannerDisabledChange(value, e) {
			profileStore.notificationsBannerDisabled = e.target.checked;
		},

		// OS notifications --------------------------------------------

		openAppsLink() {
			this.sdk.openExternalLink(this.appsLink);
		},

		// Telegram notifications --------------------------------------

		loadTelegramData() {
			if (!(this.telegramNotificationsAllowed)) {
				return;
			};

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
			const username = (this.$refs.telegramUsername.inputs[0].value || "").trim().replaceAll("@","");
			if (username) {
				const data = {
					address: this.address,
					telegram: username,
					locale: this.$i18n.locale,
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

		// VK notifications --------------------------------------------

		loadVKData() {
			if (!(this.vkNotificationsAllowed)) {
				return;
			};

			this.vkData = {
				currentState: "loading",
			};

			const vkManager = new VKManager();
			vkManager.getSubscription(this.address).then(data => {
				if (data?.subscription) {
					this.vkData = {
						currentState: "connected",
						stateData: data?.subscription,
					}
				} else {
					this.vkData = {
						currentState: "disconnected",
					}
				}
			}).catch(e => {
				console.error(e);
				this.vkData = {
					currentState: "error",
					stateData: {
						error: e,
					},
				};
			});
		},

		vkLoadingError() {
			let result = "";
			if (this.vkData?.currentState === "error") {
				result = this.vkData?.stateData?.error?.message;
			}
			return result;
		},

		openVKBotLink() {
			this.sdk.openExternalLink(this.vkBotLink);
		},

		connectVKBot() {
			const username = (this.$refs.vkUsername.inputs[0].value || "").trim().replaceAll("@","");
			if (username) {
				const data = {
					address: this.address,
					vkScreenName: username,
					locale: this.$i18n.locale,
					isEnabled: true,
				};

				this.vkData = {
					currentState: "loading",
				};

				const vkManager = new VKManager();
				vkManager.createSubscription(data).then(() => {
					this.vkData = {
						currentState: "connected",
					}
				}).catch(e => {
					console.error(e);
					this.vkData = {
						currentState: "error",
						stateData: {
							error: e,
						},
					};
				});
			} else {
				this.$refs.dialog?.instance.view(
					"error", 
					this.$t("dialogLabels.vk_username_undefined")
				);
			};
		},

		disconnectVKBotEvent() {
			this.$refs.dialog?.instance
				.view("question", this.$t("dialogLabels.disconnecting_vk_bot"))
				.then(state => {
					if (state) {
						this.disconnectVKBot();
					}
				});

		},

		disconnectVKBot() {
			this.vkData = {
				currentState: "loading",
			};

			const vkManager = new VKManager();
			vkManager.removeSubscription(this.address).then(() => {
				this.vkData = {
					currentState: "disconnected",
				}
			}).catch(e => {
				console.error(e);
				this.vkData = {
					currentState: "error",
					stateData: {
						error: e,
					},
				};
			});
		},
	},

	mounted() {
		const 
			telegramManager = new TelegramManager(),
			vkManager = new VKManager();

		Promise.allSettled([
			telegramManager.notificationsAllowed(),
			vkManager.notificationsAllowed(),
		]).then(results => {
			this.telegramNotificationsAllowed = results[0].value;
			this.vkNotificationsAllowed = results[1].value;
		}).catch(e => {
			console.error(e);
		});
	},

	watch: {
		telegramNotificationsAllowed() {
			this.loadTelegramData();
		},

		vkNotificationsAllowed() {
			this.loadVKData();
		},
	},
}