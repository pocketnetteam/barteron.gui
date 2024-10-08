import Vue from "vue";
import { createPinia, defineStore } from "pinia";
import SDK from "@/js/sdk.js";

const pinia = createPinia();

class Pinia {
	instance = pinia;
	sdk = new SDK();
	vue = Vue;
	defineStore = defineStore;

	prefix = "";

	/**
	 * Get prefix for storage
	 * 
	 * @returns {Promise}
	 */
	getPrefix() {
		return new Promise((resolve) => {
			if (!Vue.prototype?.sdk?.address) {
				this.sdk.getAddress().then(address => {
					this.prefix = address;
					resolve(this.prefix);
				});
			} else {
				this.prefix = Vue.prototype.sdk.address;
				resolve(this.prefix);
			}
		});
	}

	/**
	 * Wrap id witin prefix
	 * 
	 * @param {String} id
	 * 
	 * @returns {Promise}
	 */
	parseId(id) {
		if (!this.prefix) {
			return id;
		} else {
			return `${ this.prefix }_${ id }`
		}
	}

	/**
	 * Get data from localStorage
	 * 
	 * @param {String} id - Storage id
	 * @param {*} value - Default value
	 * 
	 * @returns {Object}
	 */
	get(id, value) {
		const item = localStorage.getItem(this.parseId(id));
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
		return localStorage.setItem(this.parseId(id), JSON.stringify(item));
	}
}

Vue.use(pinia);

export default new Pinia();