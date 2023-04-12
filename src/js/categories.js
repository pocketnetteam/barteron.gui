/**
 * Allow navigate through categories list,
 * get items by id/name
 * 
 * @class Categories
 */
export default class Categories {
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
	 * @param {Number} id
	 * @return {Object}
	 */
	get(id) {
		return this.items[id] ? Object.assign({ id: Number(id) }, this.items[id]) : {};
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
			if (this.items[id][param] === value) {
				return this.get(id);
			}
		}
	}

	/**
	 * Search by id
	 * 
	 * @param {Number, Array[Number]} id
	 * @return {Object, Array}
	 */
	findById(id) {
		return Array.isArray(id) ? id.map(n => this.get(n)) : this.get(id);
	}

	/**
	 * Search by name
	 * 
	 * @param {String, Array[String]} name
	 * @return {Object, Array}
	 */
	findByName(name) {
		return Array.isArray(name) ? name.map(n => this.find("name", n)) : this.find("name", name);
	}
};