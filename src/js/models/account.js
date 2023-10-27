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
		this.regdate = data?.additional?.regdate * 1000 || +new Date;

		/* Make hidden properties */
		Object.defineProperties(this, {
			sdk: { value: sdk }
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
		return this.sdk.setBrtAccount({ ...this.update(data) });
	}

	/**
	 * Destroy model data
	 */
	destroy() {
		delete this.sdk.barteron._accounts[this.address];
	}
};

export default Account;