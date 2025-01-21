import Profile from "@/components/profile/index.vue";
import Contacts from "@/components/profile/contacts/index.vue";
import Wallet from "@/components/wallet/index.vue";
import ExchangeList from "@/components/barter/exchange/list/index.vue";

export default {
	name: "Aside",

	components: {
		Profile,
		Contacts,
		Wallet,
		ExchangeList
	},

	inject: ['dialog'],

	computed: {
		/**
		 * Get bastyon address
		 * 
		 * @returns {String}
		 */
		address() {
			return this.$route.params.id || this.sdk.address;
		},

		/**
		 * Show is this profile is your's
		 * 
		 * @returns {Boolean}
		 */
		isMyProfile() {
			return this.address === this.sdk.address;
		},

		/**
		 * Barteron account
		 * 
		 * @returns {@Account}
		 */
		account() {
			return this.sdk.barteron.accounts[this.address];
		}
	},

	methods: {
		sendMessageEvent() {
			this.dialog?.instance
				.view("question", this.$t("dialogLabels.send_message"))
				.then(state => {
					if (state) {
						this.createRoom();
					}
				});

		},

		createRoom() {
			if (this.sdk.willOpenRegistration()) return;
			
			this.isLoading = true;
			this.dialog?.instance.view("load", this.$t("dialogLabels.opening_room"));
			this.sendMessage({
				members: [this.address],
				openRoom: true
			}).then(() => {
				this.dialog?.instance.hide();
			}).catch(e => {
				this.showError(e);
			}).finally(() => {
				this.isLoading = false;
			});
		},

	}
}