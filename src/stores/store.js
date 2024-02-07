import Vue from "vue";
import { createPinia, defineStore } from "pinia";

const pinia = createPinia();

class Pinia {
	instance = pinia;
	defineStore = defineStore;

	/**
	 * Get data from localStorage
	 * 
	 * @param {String} id - Storage id
	 * @param {*} value - Default value
	 * 
	 * @returns {Object}
	 */
	get(id, value) {
		const item = localStorage.getItem(id);

		return item ? JSON.parse(item) : value;
	}

	/**
	 * Set data to localStorage
	 * 
	 * @param {String} id - Storage id
	 * @param {*} item - Storing item
	 * 
	 * @returns {*}
	 */
	set(id, item) {
		return localStorage.setItem(id, JSON.stringify(item));
	}
}

Vue.use(pinia);

export default new Pinia();