export default {
	name: "MainMenu",

	data() {
		return {
			items: {
				home: {
					name: "About",
					path: "/about"
				},

				safety: {
					name: "Safety",
					path: "/safety"
				},

				delivery: {
					name: "Delivery",
					path: "/delivery"
				},

				faq: {
					name: "F.A.Q",
					path: "/faq"
				},

				help: {
					name: "Help",
					path: "/help"
				},
			}
		}
	}
}