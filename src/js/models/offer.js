import Vue from "vue";

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
			{ t, a, c } = JSON.parse(data?.p?.s4 || '{"t":"","a":[],"c":"new"}'),
			images = JSON.parse(data?.p?.s5 || "[]");
		
		/* Iterable properties */
		this.address = data?.address || data?.s1 || "";
		this.hash = data?.hash || data?.s2 || null;
		this.language = data?.language || data?.p?.s1 || "";
		this.caption = data?.caption || data?.p?.s2 || "";
		this.description = data?.description || data?.p?.s3 || "";
		this.tag = data?.tag || t || "";
		this.tags = data?.tags || a || [];
		this.condition = data?.condition || c || "new";
		this.images = data?.images || images;
		this.geohash = data?.geohash || data?.p?.s6 || "";
		this.price = data?.price || data?.p?.i1 || 0;

		const
			time = data?.time * 1000 || +new Date,
			date = data?.till || new Date(time),
			till = date?.setMonth(date.getMonth() + 1) || date;

		/* Hidden properties */
		Object.defineProperties(this, {
			sdk: { value: sdk },
			time: { value: time },
			till: { value: till }
		});

		if (data.hash === "draft" && !this.sdk.barteron._offers[data.hash]) {
			Vue.set(this.sdk.barteron._offers, data.hash, this);
		}
	}

	/**
	 * Update model properties
	 * 
	 * @param {Object} data
	 * 
	 * @returns {Offer}
	 */
	update(data) {
		if (Object.keys(data).length) {
			for (const p in data) {
				this[p] = data[p];
			}
		}

		return this;
	}

	/**
	 * Store model data
	 * 
	 * @param {Object} data
	 */
	set(data) {
		return this.sdk.setBrtOffer({ ...this.update(data) });
	}

	/**
	 * Destroy model data
	 */
	destroy() {
		delete this.sdk.barteron._offers[this.hash];
	}
};

export default Offer;