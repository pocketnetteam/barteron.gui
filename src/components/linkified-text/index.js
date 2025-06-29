import * as linkify from "linkifyjs";

export default {
	name: "LinkifiedText",

	props: {
		text: {
			type: String,
			default: "",
		},
	},

	methods: {
		items() {
			let result = [];
			let text = this.text || "";

			const elements = linkify.find(text);
			let links = elements.filter(f => f.isLink);
			if (links.length) {
				links.reverse().forEach(m => {
					const textPart = text.substring(m.end);
					if (textPart) {
						result.push({
							isLink: false,
							value: textPart,
						});
					};
					
					const { type, value, isLink, href} = m;
					const displayedValue = this.trimLinkValue(value);
					result.push({ type, value, displayedValue, isLink, href});

					text = text.substring(0, m.start);
				});
			};

			result.push({
				isLink: false,
				value: text,
			});

			result.reverse();

			return result;
		},

		trimLinkValue(value) {
			let result = value;

			if(value?.length > 50){
				result = value.slice(0, 50) + "…";
			};

			return result;
		},
	},
}