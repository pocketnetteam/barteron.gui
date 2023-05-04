/* Load data */
import categoriesData from "@/data/categories.json";

/**
 * Allow navigate through categories list,
 * get items by id/name
 * 
 * @class Categories
 */
class Categories {
	/**
	 * Initialize class
	 * 
	 * @constructor
	 * @param {Object} data
	 */
	constructor(data) {
		/** @private */
		this.items = data;
	}

	/**
	 * Get category with id
	 * 
	 * @param {String|Number} id
	 * @return {Object}
	 */
	get(id) {
		return this.items[id] ? Object.assign({ id: Number(id) }, this.items[id]) : {};
	}

	/**
	 * Search through items
	 * 
	 * @param {String} param
	 * @param {String|Number} value
	 * @return {Object}
	 */
	find(param, value) {
		for (let id in this.items) {
			if (this.items[id][param] === value) {
				return this.get(id);
			}
		}
	}

	/**
	 * Search by id
	 * 
	 * @param {String|Number[]} id
	 * @return {Object|Array}
	 */
	findById(id) {
		return Array.isArray(id) ? id.map(n => this.get(n)) : this.get(id);
	}

	/**
	 * Search by name
	 * 
	 * @param {String|Number[]} name
	 * @return {Object|Array}
	 */
	findByName(name) {
		return Array.isArray(name) ? name.map(n => this.find("name", n)) : this.find("name", name);
	}
};

export default new Categories(categoriesData);