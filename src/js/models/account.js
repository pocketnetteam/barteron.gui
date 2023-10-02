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
		const { a } = JSON.parse(data.p?.s4 || "{a:[]}");
		
		this.address = data?.s1 || "";
		this.hash = data?.hash || null;
		this.blockHash = data?.blockHash || "";
		this.height = data?.height || 0;
		this.tags = a;
		this.time = data?.time || 0;
		this.type = data?.type || 0;

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
		this.sdk.barteron.accounts[this.address] = { ...this, ...data };
	}
};

export default Account;