import { Carousel, Slide } from "@/components/vue-snap/index.js";
import "@/components/vue-snap/vue-snap.css";
import StickerSlide from "./slide/index.vue";
import LegalInfo from "@/components/legal-info/index.vue";
import NotificationsBanner from "@/components/notifications-banner/index.vue";
import SafeDealDialog from "@/components/safe-deal/safe-deal-dialog/index.vue";
import Vue from 'vue';

export default {
	name: "StickerList",

	components: {
		Carousel,
		Slide,
		StickerSlide,
		LegalInfo,
	},

	inject: ["dialog", "lightboxContainer"],

	data() {
		return {
		};
	},

	computed: {
		requiredLegalInfoItemKeys() {
			return [
				"user_agreement", 
				"personal_data_processing_policy"
			];
		},

		legalInfoAvailable() {
			const
				locale = this.$root.$i18n.locale,
				data = LegalInfo.methods.allDocumentsWithoutContext?.() || {},
				existingKeys = (data[locale] || []).map(m => m.i18nKey);

			return this.requiredLegalInfoItemKeys.some(f => existingKeys.includes(f));
		},
	},

	methods: {
		stickerList() {
			let items = [
				"notifications",
				"safeDeal",
				"advice"
			];

			if (this.legalInfoAvailable) {
				items.push("legalInfo");
			};

			return items;
		},

		stickerAction(item) {
			switch (item.id) {
				case "notifications":
					this.setupNotifications();
					break;

				case "safeDeal":
					this.showSafeDealInfo();
					break;

				default:
					break;
			}
		},

		setupNotifications() {
			const ComponentClass = Vue.extend(NotificationsBanner);
			const instance = new ComponentClass({
				propsData: {
					viewMode: "regular",
				},
			});
			
			instance.$on('onHide', vm => {
			});

			instance.$mount();
			this.lightboxContainer().appendChild(instance.$el);
			instance.show();
		},

		showSafeDealInfo() {
			const ComponentClass = Vue.extend(SafeDealDialog);
			const instance = new ComponentClass({
				propsData: {},
			});
			
			instance.$on('onHide', vm => {
			});

			instance.$mount();
			this.lightboxContainer().appendChild(instance.$el);
			instance.show();
		},

	},
}