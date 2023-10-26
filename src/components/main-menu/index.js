export default {
	name: "MainMenu",

	props: {
		items: {
			type: Array,
			default: () => ([
				{
					name: "Home",
					to: { name: 'home' }
				}
			])
		}
	}
}