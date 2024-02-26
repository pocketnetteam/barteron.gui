import MainMenu from "@/components/main-menu/index.vue";
import Location from "@/components/location-switcher/index.vue";
import SearchBar from "@/components/search-bar/index.vue";
import UserBar from "@/components/user-bar/index.vue";

export default {
	name: "Header",

	components: {
		MainMenu,
		Location,
		SearchBar,
		UserBar
	},

	data() {
		return {}
	}
}