import Vue from "vue";
import { numberFormats } from "@/i18n/index.js";
import { OpenStreetMapProvider } from "leaflet-geosearch";

import Account from "@/js/models/account.js";
import Offer from "@/js/models/offer.js";

/**
 * Allow work with bastyon
 * 
 * @class SDK
 */
class SDK {
	lastresult = "";
	emitted = [];
	localstorage = "";

	models = {
		Account,
		Offer
	}

	_address = "";
	get address() {
		if (!this._address) this.getAddress();
		return this._address;
	}

	_balance = {};
	get balance() {
		if (!Object.keys(this._balance).length) this.getBalance();
		return this._balance;
	}

	_location = {};
	get location() {
		if (this.empty(this._location)) {
			this.getLocation();
		}

		return this._location;
	}

	_currency = {};
	get currency() {
		if (this.empty(this._currency)) this.getCurrency();
		return this._currency;
	}

	empty(prop) {
		return prop && !Object.values(prop).length;
	}

	cyrb53(str, seed = 0) {
		let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;

		for(let i = 0, ch; i < str.length; i++) {
				ch = str.charCodeAt(i);
				h1 = Math.imul(h1 ^ ch, 2654435761);
				h2 = Math.imul(h2 ^ ch, 1597334677);
		}

		h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
		h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
		h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
		h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
	
		return 4294967296 * (2097151 & h2) + (h1 >>> 0);
	}

	constructor() {
		const $ = this;

		if (!window.BastyonSdk) return;

		this.sdk = new window.BastyonSdk();

		this.emit = this.sdk.emit;
		this.on = this.sdk.on;

		this.on("action", d => {
			const action = JSON.stringify(d);

			this.emitted.push({
				type : "action",
				data : action,
				date : new Date(),
			});
		});

		this.on("balance", balance => {
			this._balance = balance;
			this.emitted.push({
				type : "balance",
				data : JSON.stringify(balance),
				date : new Date(),
			})
		});

		this.emit("loaded");

		/**
		 * Reactive observable
		 */

		/* Reactive accounts */
		this._accounts = {};

		/* Observe accounts watcher */
		this.accounts = new Proxy(this._accounts, {
			get(target, address) {
				if (typeof address !== "string" || address?.length < 32) return this;
				else if (!target?.[address]) $.getUserProfile(address);
				return target?.[address];
			}
		})

		/* Inner storage */
		this.barteron = {
			_accounts: {},
			_offers: {},
			_details: {}
		};

		/* Observe sub-objects watchers */
		this.barteron = {
			...this.barteron,

			/* Barteron account */
			accounts: new Proxy(this.barteron._accounts, {
				get(target, address) {
					if (typeof address !== "string" || address?.length < 32) return this;
					else if (!target?.[address]) $.getBrtAccount(address);
					return target?.[address];
				}
			}),

			/* Barteron offers */
			offers: new Proxy(this.barteron._offers, {
				get(target, hash) {
					if (hash !== "draft" && (typeof hash !== "string" || hash?.length < 64)) return this;
					else if (!target?.[hash]) $.getBrtOffersByHashes([hash]);
					return target?.[hash];
				}
			})

			,

			/* Barteron offers details */
			details: new Proxy(this.barteron._details, {
				get(target, hash) {
					if (hash !== "draft" && (typeof hash !== "string" || hash?.length < 64)) return this;
					else if (!target?.[hash]) $.getBrtOffersDetails({ offerIds: [hash] });
					return target?.[hash];
				}
			})
		}
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

	/**
	 * 
	 * @param {Object} request
	 * @param {String} request.name
	 * @param {Array} request.members
	 * @param {String} request.message
	 * 
	 * @returns {Promise}
	 */
	createRoom(request) {
		return this.sdk.helpers.createroom(request);
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
	 * @returns {Promise}
	 */
	uploadImagesToImgur(images) {
		return this.sdk.set.imagesToImgur(images).then(urls => {
			this.lastresult = "uploadImageToImgur: success (console.log)"
			return urls;
		}).catch(e => this.setLastResult(e))
	}

	/**
	 * Check if permission is granted
	 * 
	 * @param {String} permission - Permission name
	 * 
	 * @returns {Boolean}
	 */
	checkPermission(permission) {
		return this.sdk.check.permission({ permission });
	}

	/**
	 * Request permissions
	 * 
	 * @param {Array} permissions
	 * 
	 * @returns {Promise}
	 */
	permissionsDialog = {}
	requestPermissions(permissions) {
		const hash = this.cyrb53(JSON.stringify(permissions));

		if (!this.permissionsDialog?.[hash]) {
			this.permissionsDialog[hash] = this.sdk.request.permissions(permissions)
				.then(result => {
					this.lastresult = "messaging: granted"
					return result.reduce((o, p) => ({ ...o, ...p }), {});
				})
				.catch(e => this.setLastResult(e))
				.finally(() => delete this.permissionsDialog[hash])
		}

		return this.permissionsDialog[hash];
	}

	/**
	 * Get bastyon address
	 * 
	 * @returns {Promise}
	 */
	async getAddress() {
		const isGranted = await this.checkPermission("account");

		if (isGranted) {
			return this.sdk.get.account().then(({ address }) => {
				this.lastresult = "user address: " + address;
				Vue.set(this, "_address", address);
				return address;
			}).catch(e => this.setLastResult(e));
		} else {
			return Promise.resolve({});
		}
	}

	/**
	 * Get bastyon user by address
	 * 
	 * @prop {String} address
	 * 
	 * @returns {Promise}
	 */
	async getUserProfile(address) {
		if (!address && !this._address) await this.getAddress();
		address = address || this._address;
		if (!this._accounts[address]) Vue.set(this._accounts, address, {});

		return this.rpc("getuserprofile", [address]).then(accounts => {
			return accounts?.map(account => {
				Vue.set(this._accounts, account.address, account);
				return account;
			});
		});
	}

	/**
	 * Get bastyon account balance
	 * 
	 * @returns {Promise}
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
	 * @returns {Promise}
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
	 * @returns {Promise}
	 */
	async getLocation() {
		const isGranted = await this.checkPermission("location");
		
		if (isGranted) {
			return this.sdk.get.location().then(location => {
				this.lastresult = location;
				Vue.set(this, "_location", location);
				return this._location;
			}).catch(e => this.setLastResult(e))
		} else {
			Vue.set(this, "_location", this._location);
			return Promise.resolve(this._location);
		}
	}

	/**
	 * Currency from min-api
	 */
	getCurrency() {
		const currencies = Object.keys(numberFormats).reduce((a, locale) => {
			return a.concat(a, [numberFormats[locale].currency.currency.toUpperCase()]);
		}, []);

		return fetch(`
			https://min-api.cryptocompare.com/data/price?
			${ new URLSearchParams({
				fsym: "PKOIN",
				tsyms: /* currencies */["USD", "EUR", "RUB"]
			}).toString() }
		`)
			.then(result => result.json())
			.then(currency => {
				this.lastresult = currency;
				Vue.set(this, "_currency", currency);
				return currency;
			})
			.catch(e => this.setLastResult(e));
	}

	/**
	 * Get address of coodrinates
	 * 
	 * @param {Array} latLng
	 * @param {Object} [data]
	 * 
	 * @returns {Promise}
	 */
	geoLocation(latLng, data) {
		/* Send request to provider url */
		const provider = new OpenStreetMapProvider();

		return fetch(`
			${ provider.reverseUrl }?
			${ new URLSearchParams({
				format: "json",
				lat: latLng?.[0],
				lon: latLng?.[1],
				zoom: 18,
				addressdetails: 1,
				...data
			}).toString() }
		`)
			.then(result => result.json())
			.catch(e => this.setLastResult(e));
	}

	/**
	 * Check access to localstroage
	 * 
	 * @returns {Array}
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
	 * @returns {Promise}
	 */
	rpc(method, props) {
		return this.sdk.rpc(method, [props]).then(result => {
			return this.lastresult = result;
		}).catch(e => this.setLastResult(e));
	}

	/**
	 * Get Node data
	 * 
	 * @returns {Promise}
	 */
	getNodeInfo() {
		return this.rpc("getnodeinfo");
	}

	/**
	 * BARTERON REQUESTS
	 */

	/**
	 * Get barteron account
	 * 
	 * @param {String} address
	 * 
	 * @returns {Promise}
	 */
	getBrtAccount(address) {
		address = address || this._address;

		if (!this.barteron._accounts[address]) {
			new Account(this, { address });
		}

		return this.rpc("getbarteronaccounts", [address]).then(accounts => {
			return accounts?.map(account => new Account(this, account));
		});
	}

	/**
	 * Set to barteron account
	 * 
	 * @param {Object} data
	 * @param {Array} data.address
	 * @param {Array} data.tags
	 * @param {String} data.geohash
	 * @param {Number} data.radius
	 * 
	 * @returns {Promise}
	 */
	setBrtAccount(data) {
		return this.sdk.set.barteron.account(data).then(result => {
			Vue.set(this.barteron._accounts, data.address, { ...this.barteron._accounts?.[data.address], ...data });
			return result;
		});
	}

	/**
	 * Get barteron offers by address
	 * 
	 * @param {String} address
	 * 
	 * @returns {Promise}
	 */
	async getBrtOffers(address) {
		if (!address && !this._address) await this.getAddress();
		address = address || this._address;

		return this.rpc("getbarteronoffersbyaddress", address).then(offers => {
			return offers?.map(offer => new Offer(this, offer)) || [];
		});
	}

	/**
	 * Set barteron offer
	 * 
	 * @param {Object} data
	 * 
	 * Base
	 * 
	 * @param {String} [data.hash]
	 * @param {String} data.language
	 * @param {String} data.caption
	 * @param {String} data.description
	 * @param {String} data.tag
	 * @param {Array} data.tags
	 * @param {String} data.condition
	 * @param {Array} data.images
	 * @param {String} data.geohash
	 * @param {Number} data.price
	 * 
	 * @returns {Promise}
	 */
	setBrtOffer(data) {
		return this.sdk.set.barteron.offer({
			...data,
			...{ hash: data.hash?.length === 64 ? data.hash : null }
		});
	}

	/**
	 * Get barteron offers by hashes
	 * 
	 * @param {Array[String]} hashes
	 * 
	 * @returns {Promise}
	 */
	getBrtOffersByHashes(hashes = []) {
		hashes.forEach(hash => {
			if (!this.barteron._offers[hash]) {
				new Offer(this, { hash });
			}
		});

		return this.rpc("getbarteronoffersbyroottxhashes", hashes).then(offers => {
			return offers?.map(offer => new Offer(this, offer)) || [];
		});
	}

	/**
	 * Get barteron offers details
	 * 
	 * @param {Object} request
	 * 
	 * Base
	 * 
	 * @param {Array[String]} request.offerIds Offer tx hashes
	 * @param {Boolean} request.includeAccounts Owner's accounts data, default: true
	 * @param {Boolean} request.includeScores Owner's accounts scores, default: true
	 * @param {Boolean} request.includeComments Owner's feedbacks, default: true
	 * @param {Boolean} request.includeCommentScores Owner's feedbacks scores, default: true
	 * 
	 * @returns {Promise}
	 */
	getBrtOffersDetails(request) {
		request?.offerIds.forEach(hash => {
			if (!this.barteron._details[hash]) {
				Vue.set(this.barteron._details, hash, {});
			}
		});

		return this.rpc("getbarteronoffersdetails", {
			offerIds: [],
			includeAccounts: true,
			includeScores: true,
			includeComments: true,
			includeCommentScores: true,
			...request
		}).then(details => {
			console.log(details)
			request?.offerIds.forEach(hash => {
				if (!this.empty(details)) {
					const data = {};

					/* Map responses with their hashes */
					for (const key in details) {
						if (key === "accounts") {
							data[key] = details[key]?.map(account => new Account(this, account)) || [];
						} else {
							data[key] = details[key]?.filter(f => f.hash === hash) || [];
						}
					}

					Vue.set(this.barteron._details, hash, data);
				}
			});

			return details;
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
	 * @returns {Promise}
	 */
	getBrtOffersFeed(request = {}) {
		return this.rpc("getbarteronfeed", request).then(feed => {
			return feed?.map(offer => new Offer(this, offer)) || [];
		});
	}

	/**
	 * Get barteron potencial offer deals
	 * 
	 * @param {Object} request
	 * 
	 * Base
	 * 
	 * @param {Array} request.addresses Filter potencial offers with these account addresses
	 * @param {Array} request.excludeAddresses Filter potencial offers by excluding offers with these addresses
	 * @param {String} request.location An SQLite3 language expression to be used with `LIKE` operator when comparing locations
	 * @param {Number} request.price Max amount of difference offer prices: abs(price1 - price2) < X
	 * @param {Array} request.myTags Filter potencial offers by the tags they are exchangable for
	 * @param {Array} request.theirTags
	 * 
	 * Pagination
	 * 
	 * @param {Number} request.topHeight Top height for start pagination
	 * @param {Number} request.pageStart Number of first page
	 * @param {Number} request.pageSize Count of offers in page
	 * @param {String} request.orderBy height | location | price
	 * @param {Boolean} request.orderDesc true | false
	 * 
	 * @returns {Promise}
	 */
	getBrtOfferDeals(request) {
		return this.rpc("getbarterondeals", {
			...request,
			myTags: (request?.myTags || []).map(tag => +tag),
			theirTags: (request?.theirTags || []).map(tag => +tag)
		}).then(deals => {
			return deals?.map(offer => new Offer(this, offer)) || [];
		});
	}

	/**
	 * Get potencial complex deals (3-side search)
	 * 
	 * @param {Object} request
	 * 
	 * Base
	 * 
	 * @param {Array} request.myTags Filter potencial offers by the tags they are exchangable for
	 * @param {Array} request.theirTags
	 * @param {String} request.location An SQLite3 language expression to be used with `LIKE` operator when comparing locations
	 * @param {Array} request.excludeAddresses Filter potencial offers by excluding offers with these addresses
	 * 
	 * @returns {Promise}
	 */
	getBrtOfferComplexDeals(request) {
		return this.rpc("getbarteroncomplexdeals", {
			...request,
			myTag: +request?.myTag,
			theirTags: (request?.theirTags || []).map(tag => +tag)
		}).then(data => {
			data?.map(match => {
				if (match.target) {
					match.target = new Offer(this, match.target);
					match.intermediates = match?.intermediates.map(offer => new Offer(this, offer)) || [];
				}
			});

			return data;
		});
	}

	/**
	 * Set barteron offer
	 * 
	 * @param {Object} data
	 * 
	 * Base
	 * 
	 * @param {String} [data.parentid]
	 * @param {String} [data.answerid]
	 * @param {String} data.postid
	 * @param {String} data.message
	 * 
	 * @returns {Promise}
	 */
	setBrtComment(data) {
		return this.sdk.set.barteron.comment(data).then(result => {
			return result;
		});
	}
}

export default SDK;