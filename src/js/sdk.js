import Vue from "vue";

/**
 * Allow work with bastyon
 * 
 * @class SDK
 */
class SDK {
	barteron = Vue.observable({
		account: {},
		offers: {},
		feed: {},
		deals: {}
	});

	lastresult = "";
	emitted = [];
	localstorage = "";

	_address = "";
	get address() {
		if (!this._address) this.getAccount();
		return this._address;
	}

	_account = [];
	get account() {
		if (!this._account.length) this.getUserInfo();
		return this._account;
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
		if (!window.BastyonSdk) return;

		this.sdk = new window.BastyonSdk();
		this.sdk.emit('loaded');

		this.sdk.on('action', d => {
			const action = JSON.stringify(d);

			this.emitted.push({
				type : 'action',
				data : action,
				date : new Date(),
			});
		});

		this.sdk.on('balance', balance => {
			this._balance = balance;
			this.emitted.push({
				type : 'balance',
				data : JSON.stringify(balance),
				date : new Date(),
			})
		});
	}

	setLastResult(e) {
		this.lastresult = e;
	}

	clearLastResult() {
		this.setLastResult('');
	}

	openSettings() {
		this.sdk.helpers.opensettings().then(() => {
			this.lastresult = 'opensettings: success'
		}).catch(e => this.setLastResult(e))
	}

	imageFromMobileCamera() {
		this.sdk.get.imageFromMobileCamera().then(images => {
			this.lastresult = 'imageFromMobileCamera: success (console.log)'
		}).catch(e => this.setLastResult(e))
	}

	alertMessage() {
		this.sdk.helpers.alert('Test message').then(() => {
			this.lastresult = 'alert: success'
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
			this.lastresult = 'uploadImageToImgur: success (console.log)'
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
			this.lastresult = 'messaging: granted'
		}).catch(e => this.setLastResult(e))
	}

	/**
	 * Get bastyon address
	 * 
	 * @return {Promise}
	 */
	getAccount() {
		return this.sdk.get.account().then(address => {
			this.lastresult = 'user address: ' + address;
			return this._address = address;
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
			return this._balance = balance;
		}).catch(e => this.setLastResult(e));
	}

	/**
	 * Make payment
	 * 
	 * @return {Promise}
	 */
	makePayment() {
		var data = {
			'recievers' : [{
				address : 'PR7srzZt4EfcNb3s27grgmiG8aB9vYNV82',
				amount : 0.01
			}], 
			'feemode' : 'include', 
			'message' : ''
		}

		this.sdk.payment(data).then(data => {
			this.lastresult = JSON.stringify(data, null, '\t')
		}).catch(e => this.setLastResult(e));
	}

	/**
	 * Location from bastyon
	 * 
	 * @return {Promise}
	 */
	getLocation() {
		return this.sdk.get.location().then(data => {
			this.lastresult = data;
			return this._location = data;
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

		localStorage['checkLocalStorageAccess'] = true
		return this.localstorage = allStorage()
	}

	/**
	 * RPC requests
	 */
	rpc(method, props) {
		return this.sdk.rpc(method, [props]).then(result => {
			return this.lastresult = result;
		}).catch(e => this.setLastResult(e));
	}

	/**
	 * Get bastyon user info
	 * 
	 * @return {Promise}
	 */
	async getUserInfo() {
		if(!this._address) await this.getAccount();

		return this.rpc('getuserprofile', [this._address]).then(data => {
			return this._account = data;
		});
	}

	/**
	 * Get Node data
	 * 
	 * @return {Promise}
	 */
	getNodeInfo() {
		return this.rpc('getnodeinfo');
	}

	/**
	 * BARTERON REQUESTS
	 */

	/**
	 * Get barteron account
	 * 
	 * @param {String} address
	 * 
	 * @return {Promise}
	 */
	getBrtAccount(address) {
		return this.rpc('getbarteronaccounts', [address ?? this._address]).then(account => {
			if (account) {
				account.forEach(acc => {
					acc.p.s4 = JSON.parse(acc.p.s4);
				});
			}

			Vue.set(this.barteron.account, address ?? this._address, account);
			return account;
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
		return this.sdk.set.barteron.account(data);
	}

	/**
	 * Get barteron offers by address
	 * 
	 * @param {String} name
	 * 
	 * @return {Promise}
	 */
	getBrtOffers(name) {
		return this.rpc('getbarteronoffersbyaddress', this._address).then(offers => {
			return this.barteron.offers[name] = offers;
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
	 * @param {String} name
	 * @param {Array[String]} hashes
	 * 
	 * @return {Promise}
	 */
	getBrtOffersByHashes(name, hashes) {
		return this.rpc('getbarteronoffersbyhashes', hashes).then(offers => {
			return this.barteron.offers[name] = offers;
		});
	}

	/**
	 * Get barteron offers feed
	 * 
	 * @param {String} name
	 * @param {Object} request
	 * 
	 * Base
	 * 
	 * @param {String} request.lang en, ru, etc
	 * @param {Array} request.tags Tags for filter offers
	 * @param {String} request.location location like 'ABC%'
	 * @param {Number} request.priceMax 0 for unuse
	 * @param {Number} request.priceMin 0 for unuse
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
	getBrtOffersFeed(name, request) {
		return this.rpc('getbarteronfeed', request).then(offers => {
			return this.barteron.feed[name] = offers;
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
		return this.rpc('getbarterondeals', request).then(deals => {
			return this.barteron.deals[name] = deals;
		});
	}
}

export default SDK;