import i18n from "@/i18n/index.js";
import router from "@/router.js";
import Profile from "@/components/profile/index.vue";

export default {
	name: "SelectValidatorDialog",

	i18n,

	router,

	components: {
		Profile
	},

	props: {
		excludedAddresses: {
			type: Array,
			default: () => []
		}
	},

	data() {
		return {
			lightbox: false,
			selected: null,
			items: [],
			isLoading: false,
		}
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

		select() {
			const 
				profile = this.$refs[`profile-${this.selected}`]?.[0],
				account = profile?.account,
				validator = {address: account?.address, settings: account?.validatorSettings};

			this.$emit('onSelect', validator);
			this.hide();
		},

		remove() {
			this.$destroy();
			this.$el.parentNode.removeChild(this.$el);			
		},
	},

	mounted() {
		const settings = this.sdk.getSafeDealSettings();
		this.items = settings.validatorAddresses.filter(f => !(this.excludedAddresses.includes(f)));
	},
}