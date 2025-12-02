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
		this.items = data || categoriesData;
	}

	/**
		 * Decode text special chars
		 * 
		 * @param {String} html
		 * 
		 * @returns {String}
		 */
	decodeString(html) {
		const text = document.createElement("textarea");
		text.innerHTML = html ?? "";
		return text.value;
	}

	/**
	 * Search through items
	 * 
	 * @param {String|Number} value
	 * 
	 * @returns {Object}
	 */
	find(value) {
		if (Number.isInteger(value)) {
			return this.items[value];
		} else {
			for (let id in this.items) {
				if (this.items[id][param] === value) {
					return this.items[id];
				}
			}
		}
	}

	/**
	 * Search by id
	 * 
	 * @param {String|String[]} id
	 * 
	 * @returns {Object|Array}
	 */
	findById(id) {
		return Array.isArray(id) ? id.map(ids => this.items[ids]) : this.items[id];
	}

	/**
	 * Search by name
	 * 
	 * @param {String|String[]} name
	 * 
	 * @returns {Object|Array}
	 */
	findByName(name) {
		return Array.isArray(name) ? name.map(n => this.find(n)) : this.find(name);
	}

	/**
	 * Get parents by id
	 * 
	 * @param {String} id
	 * 
	 * @returns {Array}
	 */
	getParentsById(id) {
		const result = [];
		let item = this.findById(id);
		while (item?.parent) {
			const parentItem = this.findById(item.parent);
			parentItem && result.unshift(parentItem);
			item = parentItem;
		};
		return result;
	}

	/**
	 * Search children recursively by id
	 * 
	 * @param {String} id
	 * 
	 * @returns {Array}
	 */
	findChildrenRecursivelyById(id) {
		let result = [];

		const current = this.findById(id);
		if (current) {
			result.push(current);
			
			const childrenIds = (current.children || []).map(id => String(id));
			childrenIds.forEach(id => {
				result = result.concat(this.findChildrenRecursivelyById(id));
			});
		}

		return result;
	}

	hasChildren(id) {
		return this.items[id]?.children?.length;
	}
};

export default Categories;