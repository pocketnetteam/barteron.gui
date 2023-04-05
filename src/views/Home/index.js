import AssocList from "@/components/categories/assoc-list/index.vue";
import BarterCarousel from "@/components/barter/list/index.vue";
import barters from "@/data/barters.json";

export default {
	name: "Home",

	components: {
		AssocList,
		BarterCarousel
	},

	data() {
		return {
			categories: [
				{ name: "Phones, gadgets", image: "categories/gadgets.svg" },
				{ name: "Computers", image: "categories/computers.svg" },
				{ name: "Shoes", image: "categories/shoes.svg" },
				{ name: "Clothes", image: "categories/clothes.svg" },
				{ name: "Sport, tourism", image: "categories/sport.svg" },
				{ name: "Beauty, health", image: "categories/beauty.svg" },
				{ name: "For pets", image: "categories/pets.svg" },
				{ name: "Electronics", image: "categories/electronics.svg" },
				{ name: "Goods for house", image: "categories/house.svg" },
				{ name: "Goods for children", image: "categories/children.svg" },
				{ name: "Goods for health", image: "categories/health.svg" },
				{ name: "Goods for cars", image: "categories/cars.svg" },
				{ name: "Building & renovation", image: "categories/building.svg" },
				{ name: "Furniture", image: "categories/furniture.svg" }
			],
			barters: barters
		}
	}
}