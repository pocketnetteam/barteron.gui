/**
 * Offer object model
 * 
 * @class Offer
 */
class Offer {
	/**
	 * Initialize model
	 * 
	 * @constructor Offer
	 * @param {Class} sdk
	 * @param {Object} data
	 */
	constructor(sdk, data) {
		/* Extract JSON values and format object */
		const
			{ t, a, c } = JSON.parse(data.p?.s4 || "{t:'',a:[],c:'new'}"),
			images = JSON.parse(data.p?.s5 || "[]");
		
		this.address = data?.s1 || "";
		this.hash = data?.s2 || null;
		this.language = data?.p?.s1 || "";
		this.caption = data?.p?.s2 || "";
		this.description = data?.p?.s3 || "";
		this.tag = t;
		this.tags = a;
		this.condition = c;
		this.images = images;
		this.geohash = data?.p?.s6 || "";
		this.price = data?.p?.i1 || 0;

		/* Make hidden property */
		Object.defineProperty(this, "sdk", {
			enumerable: false,
			writable: true,
			value: sdk
		});
	}

	/**
	 * Update model properties
	 * 
	 * @param {Object} data
	 * 
	 * @return {Offer}
	 */
	update(data) {
		for (const p in data) {
			this[p] = data[p];
		}

		return thisl
	}

	/**
	 * Store model data
	 * 
	 * @param {Object} data
	 */
	set(data) {
		return this.sdk.barteron.offers[this.hash] = { ...this, ...data };
	}
};

export default Offer;