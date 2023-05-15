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
		this.items = data;
	}

	/**
	 * Generate list of barters with
	 * given count and category
	 * 
	 * @param {Number} count
	 * @param {Object} [params]
	 * @return {Array}
	 */
	generate(count, params) {
		/* Defaults */
		params = Object.assign({
			used: "rand",				/* or Boolean */
			image: "rand",			/* or String or [...String] */
			price: "rand",			/* or Number or [min, max] */
			name: "rand",				/* or String */
			parent: "rand",			/* or Number */
			to: "rand",					/* or Number or [...Number] */
			published: "rand",	/* or Timestamp or [min, max]*/
			location: "rand"		/* or [lat, long] */
		}, params);

		/* Prepare barter item */
		return [...Array(count)].map((m, index) => {
			const
				id = Object.keys(this.items).length + index,
				barter = { id: id };

			for (const [key, value] of Object.entries(params)) {
				switch(key) {
					case "used": {
						if (value === "rand") barter[key] = Math.random() < 0.5;
						break;
					}

					case "image": {
						if (value === "rand") barter[key] = this.getRandom()?.image;
						break;
					}

					case "price": {
						if (value === "rand") barter[key] = this.getRandom()?.price;
						else if (Array.isArray(value)) barter[key] = this.randIntInArray(value);
						break;
					}

					case "name": {
						if (value === "rand") barter[key] = this.getRandom()?.name;
						break;
					}

					case "parent": {
						if (value === "rand") barter[key] = this.getRandom()?.parent;
						break;
					}

					case "to": {
						if (value === "rand") barter[key] = this.getRandom()?.to;
						break;
					}

					case "published": {
						if (value === "rand") barter[key] = this.randIntInArray([+new Date - 1000000, +new Date]);
						break;
					}

					case "location": {
						if (value === "rand") barter[key] = [
							this.randIntInArray([-90, 90]), /* Lat */
							this.randIntInArray([-180, 180]) /* Long */
						];
						break;
					}
				}

				if (!barter.hasOwnProperty(key)) barter[key] = value;
			}

			this.items[id] = barter;

			return barter;
		});
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

export default new Barters(bartersData);