export default {
	name: "LegalInfo",

	props: {
		i18nDocumentKeys: {
			type: Array,
			default: () => []
		}
	},

	methods: {
		allDocumentsWithoutContext() {
			return {
				"ru-RU": [
					{
						i18nKey: "user_agreement",
						icon: "file-pdf",
						fileName: "UserAgreement.pdf",
					},
					{
						i18nKey: "personal_data_processing_policy",
						icon: "file-pdf",
						fileName: "PersonalDataProcessingPolicy.pdf",
					},
					{
						i18nKey: "barter_agreement_draft",
						icon: "file-word",
						fileName: "BarterAgreementDraft.docx",
					},
				],
			};
		},

		list() {
			const 
				data = this.allDocumentsWithoutContext(),
				locale = this.$root.$i18n.locale;

			return (data[locale] || []).filter(f => this.i18nDocumentKeys.includes(f.i18nKey));
		},

		openDocument(item) {
			let scope = this.sdk.appinfo?.application?.scope;
			if (scope) {
				scope = scope.startsWith('http') ? scope : `https://${scope}`;
				const locale = this.$root.$i18n.locale;
				const link = `${scope}/docs/${locale}/${item.fileName}`;
				this.sdk.openExternalLink(link);
			} else {
				const e = new Error("scope is undefined");
				console.error(e);
			}
		},
	},
}