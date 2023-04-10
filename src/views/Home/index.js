import AssocList from "@/components/categories/assoc-list/index.vue";
import BarterList from "@/components/barter/list/index.vue";
import Banner from "@/components/banner/index.vue";

import barters from "@/data/barters.json";

export default {
	name: "Home",

	components: {
		AssocList,
		BarterList,
		Banner
	},

	data() {
		return {
			categories: [
				{ name: "cell_phones_accessories", image: "categories/gadgets.svg" },
				{ name: "computers_high_tech", image: "categories/computers.svg" },
				{ name: "shoes", image: "categories/shoes.svg" },
				{ name: "dresses", image: "categories/clothes.svg" },
				{ name: "sporting_goods", image: "categories/sport.svg" },
				{ name: "health_beauty", image: "categories/beauty.svg" },
				{ name: "small_pets", image: "categories/pets.svg" },
				{ name: "consumer_electronics", image: "categories/electronics.svg" },
				{ name: "household_supplies_cleaning", image: "categories/house.svg" },
				{ name: "childrens_vintage_clothing", image: "categories/children.svg" },
				{ name: "beauty_personal_care", image: "categories/health.svg" },
				{ name: "cars_trucks_vans", image: "categories/cars.svg" },
				{ name: "building_materials_supplies", image: "categories/building.svg" },
				{ name: "office_furniture", image: "categories/furniture.svg" }
			],
			barters: barters
		}
	}
}