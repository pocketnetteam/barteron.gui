<template>
	<div id="app">
		<Header />

		<section id="main">
			<router-view />
			<div id="container">
				<router-view name="aside" />
				<router-view name="content" />
				<router-view name="sidebar" />
			</div>
		</section>

		<Footer />
	</div>
</template>

<style lang="sass" src="@/css/main.sass"></style>
<style src="@/assets/font-awesome/css/all.css"></style>
<script>
import Categories from "@/js/categories.js"
import categoriesData from "@/data/categories.json";
import Header from "@/components/layout/header/index.vue";
import Footer from "@/components/layout/footer/index.vue";

export default {
	name: "Barteron",

	components: {
		Header,
		Footer
	},

	provide() {
		return {
			categories: this.categories,
			favorite: this.favorite
		}
	},

	data() {
		return {
			favorite: {
				1: { name: "cell_phones_accessories", image: "categories/gadgets.svg" },
				2: { name: "computers_high_tech", image: "categories/computers.svg" },
				3: { name: "shoes", image: "categories/shoes.svg" },
				4: { name: "dresses", image: "categories/clothes.svg" },
				5: { name: "sporting_goods", image: "categories/sport.svg" },
				6: { name: "health_beauty", image: "categories/beauty.svg" },
				7: { name: "small_pets", image: "categories/pets.svg" },
				8: { name: "consumer_electronics", image: "categories/electronics.svg" },
				9: { name: "household_supplies_cleaning", image: "categories/house.svg" },
				10: { name: "childrens_vintage_clothing", image: "categories/children.svg" },
				11: { name: "beauty_personal_care", image: "categories/health.svg" },
				12: { name: "cars_trucks_vans", image: "categories/cars.svg" },
				13: { name: "building_materials_supplies", image: "categories/building.svg" },
				14: { name: "office_furniture", image: "categories/furniture.svg" }
			}
		}
	},

	computed: {
		categories() {
			return new Categories(categoriesData);
		}
	}
}
</script>