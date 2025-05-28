export default {
	name: "Complain",

	props: {
		item: {
			type: Object,
			default: () => ({})
		},
	},

	methods: {
		openComplaintDialog() {
			if (this.sdk.willOpenRegistration()) return;

			const 
				link = this.sdk.appLink(`barter/${ this.item.hash }`),
				url = new URL(link),
				entityLink = "/application" + url.search,
				entityTxid = this.item.hash;

			const data = { 
				entityLink,
				entityTxid,
			};
			this.sdk.openComplaintDialog(data);
		},
	}
}