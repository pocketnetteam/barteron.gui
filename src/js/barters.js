/* Load data */
import bartersData from "@/data/barters.json";

/**
 * Allow navigate through barter list,
 * get items by id/name or generate new
 * 
 * @class Barters
 */
class Barters {
	/**
	 * Initialize class
	 * 
	 * @constructor
	 * @param {Object} data
	 */
	constructor(data) {
		/** @private */
		this.items = data || bartersData;
	}

	/**
	 * Generate list of barters with
	 * given count and category
	 * 
	 * @param {Number} count
	 * @param {Object} props
	 * @return {Array}
	 */
	generate(count, props) {
		/* Prepare barter item */
		const barters = [];

		for (let i = 0; i < count; i++) {
			const
				id = Object.keys(this.items).length + i,
				barter = (() => {
					const item = this.getRandom();
					return item?.image === barters[i-1]?.image ? this.getRandom() : item;
				})(),
				date = new Date(barter.published),
				until = new Date(date.setMonth(date.getMonth()+1));

			this.items[id] = Object.assign(barter, { id: id, published: date, until: until }, props);
			barters.push(this.items[id]);
		}

		return barters;
	}

	/**
	 * Get random barter
	 * 
	 * @return {Object}
	 */
	getRandom() {
		const ids = Object.keys(this.items);

		return this.get(
			ids[Math.floor(Math.random() * ids.length)]
		);
	}

	/**
	 * Get random int between min and max in Array
	 * 
	 * @param {Number[]} p - [min, max]
	 * @returns 
	 */
	randIntInArray(p) {
		return Math.floor(Math.random() * (p[1] - p[0]) + p[0])
	}

	/**
		 * Decode text special chars
		 * 
		 * @param {String} html
		 * @return {String}
		 */
	decodeString(html) {
		const text = document.createElement("textarea");
		text.innerHTML = html ?? "";
		return text.value;
	}

	/**
	 * Get barter with id
	 * 
	 * @param {String|Number} id
	 * @return {Object}
	 */
	get(id) {
		return this.items[id] ? ((item) => Object.assign({
			id: Number(id),
			name: this.decodeString(item?.name),
			descrition: this.decodeString(item?.descrition)
		}, item))(this.items[id]) : {};
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

export default Barters;