<template>
	<div id="app">
		<Header />

		<div id="main">
			<router-view />
			<div id="container">
				<router-view name="aside" />
				<router-view name="content" />
				<router-view name="sidebar" />
			</div>
		</div>

		<Footer />
	</div>
</template>

<style lang="sass" src="@/css/main.sass"></style>
<style src="@/assets/font-awesome/css/all.css"></style>
<script>
import categories from "@/data/categories.json";
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
			categories: this.categories
		}
	},

	data() {
		return {

		}
	},

	computed: {
		categories() {
			const $ = this;
			/**
			 * @class Categories
			 */
			class Categories {
				/**
				 * @param {Object} data
				 */
				constructor(data) {
					this.items = data;
					return this;
				}

				/**
				 * Get category as Object
				 * 
				 * @param {Number} id
				 * @return {Object}
				 */
				get(id) {
					return Object.assign({ id: id }, this.items[id]);
				}

				/**
				 * Search through items
				 * 
				 * @param {String} param
				 * @param {Number, String} value
				 * @return {Object}
				 */
				find(param, value) {
					for (let id in this.items) {
						if (items[id][param] === value) {
							return this.get(id);
						}
					}
				}

				/**
				 * Search by id
				 * 
				 * @param {Number} id
				 * @return {Object}
				 */
				findById(id) {
					return this.get(id);
				}

				/**
				 * Search by name
				 * 
				 * @param {String} name
				 * @return {Object}
				 */
				findByName(name) {
					return this.find("name", name);
				}
			};

			return new Categories(categories);
		}
	},

	mounted() {
		// console.log(this.categories.findByName("office_furniture"))
	}
}
</script>