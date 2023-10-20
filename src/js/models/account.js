/**
 * Barteron account object model
 * 
 * @class Account
 */
class Account {
	/**
	 * Initialize model
	 * 
	 * @constructor Account
	 * @param {Class} sdk
	 * @param {Object} data
	 */
	constructor(sdk, data) {
		/* Extract JSON values and format object */
		const { a, g, s, r } = JSON.parse(data?.p?.s4 || '{"a":[],"g":"","s":false,"r":0}');
		
		this.address = data?.address || data?.s1 || "";
		this.hash = data?.hash || data?.hash || null;
		this.blockHash = data?.blockHash || "";
		this.height = data?.height || 0;
		this.tags = data?.tags || a || [];
		this.geohash = data?.geohash || g || "";
		this.static = data?.static || s || false;
		this.radius = data?.radius || r || 0;
		this.time = data?.time || 0;
		this.type = data?.type || 0;
		this.additional = data?.additional || {};

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
	 * @return {Account}
	 */
	update(data) {
		for (const p in data) {
			this[p] = data[p];
		}

		return this;
	}

	/**
	 * Store model data
	 * 
	 * @param {Object} data
	 */
	set(data) {
		this.update(data);
		return this.sdk.setBrtAccount({ ...this, ...data });
	}
};

export default Account;