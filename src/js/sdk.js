import Vue from "vue";

/**
 * Allow work with bastyon
 * 
 * @class SDK
 */
class SDK {
	lastresult = "";
	emitted = [];
	localstorage = "";

	_address = "";
	get address() {
		if (!this._address) this.getAccount();
		return this._address;
	}

	_balance = {};
	get balance() {
		if (!this._balance.length) this.getBalance();
		return this._balance;
	}

	_location = {};
	get location() {
		if (this.empty("_location")) this.getLocation();
		return this._location;
	}

	empty(prop) {
		return !Object.values(this?.[prop]).length;
	}

	constructor() {
		const $ = this;

		if (!window.BastyonSdk) return;

		this.sdk = new window.BastyonSdk();
		this.sdk.emit("loaded");

		this.sdk.on("action", d => {
			const action = JSON.stringify(d);

			this.emitted.push({
				type : "action",
				data : action,
				date : new Date(),
			});
		});

		this.sdk.on("balance", balance => {
			this._balance = balance;
			this.emitted.push({
				type : "balance",
				data : JSON.stringify(balance),
				date : new Date(),
			})
		});

		/**
		 * Reactive observable
		 */

		/* Reactive accounts */
		this._account = {};

		/* Observe accounts watcher */
		this.account = new Proxy(this._account, {
			get(target, address) {
				if (typeof address !== "string" || address?.length < 32) return this;
				else if (!target?.[address]) $.getUserInfo(address);
				return target?.[address];
			}
		})

		/* Reactive sub-objects */
		this.barteron = {
			_account: {},
			_offers: {}
		};

		/* Observe sub-objects watchers */
		this.barteron = Object.assign(this.barteron, {
			/* Barteron account operations */
			account: new Proxy(this.barteron._account, {
				get(target, address) {
					if (typeof address !== "string" || address?.length < 32) return this;
					else if (!target?.[address]) $.getBrtAccount(address);
					return target?.[address];
				},
				set(target, address, { tags }) {
					return $.setBrtAccount({ address, tags });
				}
			}),

			/* Barteron offers operations */
			offers: new Proxy(this.barteron._offers, {
				get(target, hash) {
					if (typeof hash !== "string" || hash?.length < 64) return this;
					else if (!target?.[hash]) $.getBrtOffersByHashes([hash]);
					return target?.[hash];
				},
				set(target, hash, data) {
					return $.setBrtOffer({ hash, ...data });
				}
			})
		});
	}

	setLastResult(e) {
		this.lastresult = e;
	}

	clearLastResult() {
		this.setLastResult("");
	}

	openSettings() {
		this.sdk.helpers.opensettings().then(() => {
			this.lastresult = "opensettings: success"
		}).catch(e => this.setLastResult(e))
	}

	imageFromMobileCamera() {
		this.sdk.get.imageFromMobileCamera().then(images => {
			this.lastresult = "imageFromMobileCamera: success (console.log)"
		}).catch(e => this.setLastResult(e))
	}

	alertMessage() {
		this.sdk.helpers.alert("Test message").then(() => {
			this.lastresult = "alert: success"
		}).catch(e => this.setLastResult(e))
	}

	/**
	 * Upload images to imgur
	 * 
	 * @param {Array} images
	 * 
	 * @return {Promise}
	 */
	uploadImagesToImgur(images) {
		return this.sdk.set.imagesToImgur(images).then(urls => {
			this.lastresult = "uploadImageToImgur: success (console.log)"
			return urls;
		}).catch(e => this.setLastResult(e))
	}

	/**
	 * Request permissions
	 * 
	 * @param {Array} permissions
	 * 
	 * @return {Promise}
	 */
	requestPermissions(permissions) {
		return this.sdk.request.permissions(permissions).then(() => {
			this.lastresult = "messaging: granted"
		}).catch(e => this.setLastResult(e))
	}

	/**
	 * Get bastyon address
	 * 
	 * @return {Promise}
	 */
	getAccount() {
		return this.sdk.get.account().then(address => {
			this.lastresult = "user address: " + address;
			Vue.set(this, "_address", address);
			return address;
		}).catch(e => this.setLastResult(e));
	}

	/**
	 * Get bastyon account balance
	 * 
	 * @return {Promise}
	 */
	getBalance() {
		return this.sdk.get.balance().then(balance => {
			this.lastresult = balance;
			Vue.set(this, "_balance", balance)
			return balance;
		}).catch(e => this.setLastResult(e));
	}

	/**
	 * Make payment
	 * 
	 * @return {Promise}
	 */
	makePayment() {
		var data = {
			"recievers" : [{
				address : "PR7srzZt4EfcNb3s27grgmiG8aB9vYNV82",
				amount : 0.01
			}], 
			"feemode" : "include", 
			"message" : ""
		}

		this.sdk.payment(data).then(data => {
			this.lastresult = JSON.stringify(data, null, "\t")
		}).catch(e => this.setLastResult(e));
	}

	/**
	 * Location from bastyon
	 * 
	 * @return {Promise}
	 */
	getLocation() {
		return this.sdk.get.location().then(location => {
			this.lastresult = location;
			Vue.set(this, "_location", location)
			return location;
		}).catch(e => this.setLastResult(e))
	}

	/**
	 * Check access to localstroage
	 * 
	 * @return {Array}
	 */
	checkLocalStorageAccess() {
		function allStorage() {
			var values = [],
				keys = Object.keys(localStorage),
				i = keys.length;

			while ( i-- ) {
				values.push( localStorage.getItem(keys[i]) );
			}

			return values;
		}

		localStorage["checkLocalStorageAccess"] = true
		return this.localstorage = allStorage()
	}

	/**
	 * RPC requests
	 * 
	 * @prop {String} method
	 * @prop {Object} props
	 * 
	 * @return {Promise}
	 */
	rpc(method, props) {
		return this.sdk.rpc(method, [props]).then(result => {
			return this.lastresult = result;
		}).catch(e => this.setLastResult(e));
	}

	/**
	 * Get bastyon user info
	 * 
	 * @prop {String} address
	 * 
	 * @return {Promise}
	 */
	async getUserInfo(address) {
		if (!address && !this._address) await this.getAccount();
		address = address || this._address;
		if (!this._account[address]) Vue.set(this._account, address, {});

		return this.rpc("getuserprofile", [address]).then(accounts => {
			return accounts.map(account => {
				Vue.set(this._account, account.address, account);
				return account;
			});
		});
	}

	/**
	 * Get Node data
	 * 
	 * @return {Promise}
	 */
	getNodeInfo() {
		return this.rpc("getnodeinfo");
	}

	/**
	 * BARTERON REQUESTS
	 */

	/**
	 * Convert server-side account object
	 * 
	 * @param {Object} account
	 * @return {Object}
	 */
	importBrtAccount(account) {
		/* Extract JSON values and format object */
		const { a } = JSON.parse(account.p?.s4 || "{a:[]}");

		return {
			...account,
			address: account.s1,
			tags: a
		};
	}

	/**
	 * Convert server-side offer object
	 * 
	 * @param {Object} offer
	 * @return {Object}
	 */
	importBrtOffer(offer) {
		/* Extract JSON values and format object */
		const
			{ t, a } = JSON.parse(offer.p?.s4 || "{t:'',a:[]}"),
			images = JSON.parse(offer.p?.s5 || "[]");

		return {
			...offer,
			language: offer.p?.s1,
			caption: offer.p?.s2,
			description: offer.p?.s3,
			tag: t,
			tags: a,
			images,
			geohash: offer.p?.s6,
			price: offer.p?.i1
		}
	}

	/**
	 * Get barteron account
	 * 
	 * @param {String} address
	 * 
	 * @return {Promise}
	 */
	getBrtAccount(address) {
		address = address || this._address;

		if (!this.barteron._account[address]) {
			Vue.set(this.barteron._account, address, {});
		}

		return this.rpc("getbarteronaccounts", [address]).then(accounts => {
			if (accounts?.length) {
				accounts = accounts.map(account => {
					account = this.importBrtAccount(account);
					Vue.set(this.barteron._account, account.address, account);

					return account;
				});
			}

			return accounts;
		});
	}

	/**
	 * Set to barteron account
	 * 
	 * @param {Object} data
	 * @param {Array} data.address
	 * @param {Array} data.tags
	 * 
	 * @return {Promise}
	 */
	setBrtAccount(data) {
		return this.sdk.set.barteron.account(data).then(result => {
			Vue.set(this.barteron._account?.[data.address], "tags", data.tags);
			return result;
		});
	}

	/**
	 * Get barteron offers by address
	 * 
	 * @param {String} address
	 * 
	 * @return {Promise}
	 */
	async getBrtOffers(address) {
		if (!address && !this._address) await this.getAccount();
		address = address || this._address;

		return this.rpc("getbarteronoffersbyaddress", address).then(offers => {
			if (offers?.length) {
				offers = offers.map(offer => this.importBrtOffer(offer));
			}

			return offers;
		});
	}

	/**
	 * Set barteron offer
	 * 
	 * @param {Object} data
	 * 
	 * Base
	 * 
	 * @param {String} data.language
	 * @param {String} data.caption
	 * @param {String} data.description
	 * @param {String} data.tag
	 * @param {Array} data.tags
	 * @param {Array} data.images
	 * @param {String} data.geohash
	 * @param {Number} data.price
	 * 
	 * @return {Promise}
	 */
	setBrtOffer(data) {
		return this.sdk.set.barteron.offer(data);
	}

	/**
	 * Get barteron offers by hashes
	 * 
	 * @param {Array[String]} hashes
	 * 
	 * @return {Promise}
	 */
	getBrtOffersByHashes(hashes = []) {
		hashes.forEach(hash => {
			if (!this.barteron._offers[hash]) {
				Vue.set(this.barteron._offers, hash, {});
			}
		});

		return this.rpc("getbarteronoffersbyhashes", hashes).then(offers => {
			if (offers?.length) {
				offers = offers.map(offer => {
					offer = this.importBrtOffer(offer);
					Vue.set(this.barteron._offers, offer.hash, offer);

					return offer;
				});
			}

			return offers;
		});
	}

	/**
	 * Get barteron offers feed
	 * 
	 * @param {Object} request
	 * 
	 * Base
	 * 
	 * @param {String} request.lang en-US, ru-RU, etc
	 * @param {Array} request.tags Tags for filter offers
	 * @param {String} request.location location like "ABC%"
	 * @param {Number} request.priceMin 0 for unuse
	 * @param {Number} request.priceMax 0 for unuse
	 * @param {String} request.search String for fulltext search in Caption and Description
	 * 
	 * Pagination
	 * 
	 * @param {Number} request.topHeight Top height for start pagination
	 * @param {Number} request.pageStart Number of first page
	 * @param {Number} request.pageSize Count of offers in page
	 * @param {String} request.orderBy height | location | price
	 * @param {Boolean} request.orderDesc true | false
	 * 
	 * @return {Promise}
	 */
	getBrtOffersFeed(request = {}) {
		return this.rpc("getbarteronfeed", request).then(offers => {
			return offers?.map(offer => this.importBrtOffer(offer)) || [];
		});
	}

	/**
	 * Get barteron potencial offer deals
	 * 
	 * @param {String} name
	 * @param {Object} request
	 * 
	 * Base
	 * 
	 * @param {String} request.offer Offer tx hash for find deals
	 * @param {String} request.address Filter potencial offers with this account address
	 * @param {Number} request.location Count of symbols for compare locations: substr(loc1, X) == substr(loc2, X)
	 * @param {Number} request.price Max amount of difference offer prices: abs(price1 - price2) < X
	 * 
	 * Pagination
	 * 
	 * @param {Number} request.topHeight Top height for start pagination
	 * @param {Number} request.pageStart Number of first page
	 * @param {Number} request.pageSize Count of offers in page
	 * @param {String} request.orderBy height | location | price
	 * @param {Boolean} request.orderDesc true | false
	 * 
	 * @return {Promise}
	 */
	getBrtOfferDeals(name, request) {
		return this.rpc("getbarterondeals", request).then(deals => {
			return deals;
		});
	}
}

export default SDK;