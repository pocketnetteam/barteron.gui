import Vue from "vue";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import CountriesTimezones from "countries-and-timezones";
import CityTimezones from "city-timezones";
import VueI18n, { currencies } from "@/i18n/index.js";
import { GeoHashLimitator } from "@/js/geohashUtils.js";

import Account from "@/js/models/account.js";
import Offer from "@/js/models/offer.js";
import OfferScore from "@/js/models/offerScore.js";
import Comment from "@/js/models/comment.js";
import AppErrors from "@/js/appErrors.js";
import deliverySettings from "@/js/deliverySettings.js";
import safeDealSettings from "@/js/safeDealSettings.js";
import banProcessor from "@/js/banUtils.js";

/**
 * Allow work with bastyon
 * 
 * @class SDK
 */
class SDK {
	lastresult = "";
	emitted = [];
	localstorage = "";
	requestServiceData = {
		ids: {},
	};
	offerUpdateActionId = null;
	lastPublishedOfferId = null;

	models = {
		Account,
		Offer,
		OfferScore,
		Comment
	};

	txTypes = {
		contentDelete: {
			code: 207,
			name: 'contentDelete',
		}
	};

	get MD5() {
		return function(d){
			const result = M(V(Y(X(d),8*d.length)));
			return result.toLowerCase()
		};
		function M(d){
			for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)
				_=d.charCodeAt(r),
			f+=m.charAt(_>>>4&15)+m.charAt(15&_);
			return f
		}
		function X(d){
			for(var _=Array(d.length>>2),m=0;m<_.length;m++)
				_[m]=0;
			for(m=0;m<8*d.length;m+=8)
				_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;
			return _
		}
		function V(d){
			for(var _="",m=0;m<32*d.length;m+=8)
				_+=String.fromCharCode(d[m>>5]>>>m%32&255);
			return _
		}
		function Y(d,_){
			d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;
			for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){
				var h=m,t=f,g=r,e=i;
				f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)
			}
			return Array(m,f,r,i)
		}
		function md5_cmn(d,_,m,f,r,i){
			return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)
		}
		function md5_ff(d,_,m,f,r,i,n){
			return md5_cmn(_&m|~_&f,d,_,r,i,n)
		}
		function md5_gg(d,_,m,f,r,i,n){
			return md5_cmn(_&f|m&~f,d,_,r,i,n)
		}
		function md5_hh(d,_,m,f,r,i,n){
			return md5_cmn(_^m^f,d,_,r,i,n)
		}
		function md5_ii(d,_,m,f,r,i,n){
			return md5_cmn(m^(_|~f),d,_,r,i,n)
		}
		function safe_add(d,_){
			var m=(65535&d)+(65535&_);
			return(d>>16)+(_>>16)+(m>>16)<<16|65535&m
		}
		function bit_rol(d,_){
			return d<<_|d>>>32-_
		};
	}

	get surveyURL() {
		return "https://p2p.back.pocketnet.app/barteron/survey";
	};

	get bastyonBoostInfoURL() {
		return "https://bastyon.com/boost";
	};

	get referralProgramInfoURL() {
		return {
			link: "https://barteron.bastyon.com/#prom-part",
			title: "https://barteron.bastyon.com",
		}
	};

	_appinfo = null;
	get appinfo() {
		if (!this._appinfo) this.getAppInfo();
		return this._appinfo;
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
			this.requestUserLocation(false, false);
		}
		return this._location;
	}

	_currency = {};
	get currency() {
		if (this.empty(this._currency)) this.getCurrency();

		return this._currency;
	}

	get isBannedUser() {
		return (typeof this._address === "string") 
			&& this._address 
			&& banProcessor.isBannedAddress(this._address);
	}

	get infiniteAction() {
		return new Promise((resolve, reject) => {});
	}

	/**
	 * Get language by locale
	 * 
	 * @param {String} locale
	 * 
	 * @returns {String}
	 */
	getLanguageByLocale(locale) {
		return String(locale || "").split("-").shift();
	}

	/**
	 * Get error message
	 * 
	 * @param {Object} error
	 * @param {Object} options
	 * 
	 * @returns {String}
	 */
	errorMessage(
		error, 
		options = {
			key: null,
			details: null,
		}
	) {
		let key = options?.key
		if (!key) {
			const
				getKey = (code) => `dialogLabels.error#${ code }`,
				defaultCode = 0,
				parsedCode = `${ error?.toString()?.replace(/[^\d-]/g, "") || defaultCode }`,
				resultCode = VueI18n.te(getKey(parsedCode)) ? parsedCode : defaultCode;
			
			key = getKey(resultCode);
		}

		const details = options?.details || error?.message || error?.toString();

		return VueI18n.t(key, { error: details });
	}

	/**
	 * Creates disabled permissions error
	 * 
	 * @param {Array} items - Permission items
	 * 
	 * @returns {Error}
	 */
	disabledPermissionsError(items) {
		const
			options = {
				key: "dialogLabels.disabled_permissions",
				details: items.join(', ')
			},
			message = this.errorMessage(null, options);

		return new Error(message);
	}

	/**
	 * Check if Array/Object is empty
	 * 
	 * @param {*} prop
	 * 
	 * @returns {*}
	 */
	empty(prop) {
		return !prop || prop && !Object.entries(prop).length;
	}

	/**
	 * If empty return reference
	 * 
	 * @param {*} prop
	 * @param {*} reference
	 * 
	 * @returns {*}
	 */
	ifEmpty(prop, reference) {
		return this.empty(prop) ? reference : prop;
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

	hexEncode= function(text) {
		var ch = 0;
		var result = "";
		for (var i = 0; i < text.length; i++)
		{
			ch = text.charCodeAt(i);
			if (ch > 0xFF) ch -= 0x350;
			ch = ch.toString(16);
			while (ch.length < 2) ch = "0" + ch;
			result += ch;
		}
		return result;
	}

	hexDecode= function(hex) {
		var ch = 0;
		var result = "";
		hex = trim(hex);
		for (var i = 2; i <= hex.length; i += 2)
		{
			ch = parseInt(hex.substring(i - 2, i), 16);
			if (ch >= 128) ch += 0x350;
			ch = String.fromCharCode("0x" + ch.toString(16));
			result += ch;
		}
		return result;
	}	

	createId(options = {}) {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
		}

		let result = "";

		const format = options?.format || "";
		switch (format) {
			case "16chars":
				result = s4() + s4() + s4() + s4();
				break;

			default:
				result = s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
				break;
		}

		return result;
	}

	constructor() {
		if (SDK._instance) {
			return SDK._instance;
		}
		
		if (!window.BastyonSdk) return;

		SDK._instance = this;

		const $ = this;

		this.sdk = new window.BastyonSdk();
		this.sdk.init();

		this.sdk.serviceWorker?.register().then((registration) => {
			if (registration) {
				console.log("🔒 Service Worker registered - external requests will use Tor when available");
			} else {
				console.log("ℹ️ Service Worker not available or Tor not supported");
			}
		}).catch(error => {
			console.error("Service Worker registration failed:", error);
		});

		this.emit = this.sdk.emit;
		this.on = this.sdk.on;
		this.off = this.sdk.off;

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
		});

		/* Inner storage */
		this.barteron = {
			_accounts: {},
			_offers: {},
			_details: {},
			_offerScores: {},
			_averageOfferScores: {},
			_comments: {}
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
			}),

			/* Barteron offers details */
			details: new Proxy(this.barteron._details, {
				get(target, hash) {
					if (hash !== "draft" && (typeof hash !== "string" || hash?.length < 64)) return this;
					else if (!target?.[hash]) $.getBrtOffersDetails({ offerIds: [hash] });
					return target?.[hash];
				}
			}),

			/* Barteron offers scores */
			offerScores: new Proxy(this.barteron._offerScores, {
				get(target, hash) {
					if (hash !== "draft" && (typeof hash !== "string" || hash?.length < 64)) return this;
					return target?.[hash];
				}
			}),

			/* Barteron average offers scores */
			averageOfferScores: new Proxy(this.barteron._averageOfferScores, {
				get(target, hash) {
					if (hash !== "draft" && (typeof hash !== "string" || hash?.length < 64)) return this;
					return target?.[hash];
				}
			}),

			/* Barteron offers comments */
			comments: new Proxy(this.barteron._comments, {
				get(target, hash) {
					if (hash !== "draft" && (typeof hash !== "string" || hash?.length < 64)) return this;
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

	/**
	 * Get app info
	 * 
	 * @returns {Promise}
	 */
	getAppInfo() {
		return this.sdk.get.appinfo().then(info => {
			this.lastresult = "appinfo: " + info;
			Vue.set(this, "_appinfo", info);
			return info;
		}).catch(e => this.setLastResult(e));
	}

	getTransactionsApiVersion() {
		return (this.appinfo?.transactionsApiVersion || 0);
	}

	isProductionEnvironment() {
		return (process.env.NODE_ENV === "production");
	}

	/**
	 * Checks if this is the Brighteon project
	 * 
	 * @returns {Boolean}
	 */
	isBrighteonProject() {
		return ((this.appinfo?.project?.name || "").toLowerCase() === "brighteon");
	}

	/**
	 * Setup request for Brighteon project
	 * 
	 * @param {Object} request
	 */
	setupRequestForBrighteon(request) {
		const params = this.getBrighteonProjectParams();
		request.lang = params.locale;
		
		const limitator = new GeoHashLimitator(request.location, params.location.alias);
		request.location = limitator.limit();
	}

	/**
	 * Setup RPC options for Brighteon project
	 * 
	 * @param {Object} options
	 */
	setupRPCOptionsForBrighteon(options) {
		if (this.isProductionEnvironment()) {
			options.rpc = {
				fnode: this.getRPCNodeForBrighteon(),
			};
		};
	}

	getRPCNodeForBrighteon() {
		if (!(this._RPCNodeForBrighteon)) {
			const 
				index = (Math.random() < 0.5 ? 0 : 1),
				items = [
					"65.21.56.203:38081",
					"135.181.196.243:38081"
				];

			this._RPCNodeForBrighteon = items[index];
		}
		return this._RPCNodeForBrighteon;
	}

	/**
	 * Setup RPC options for method
	 * 
	 * @param {String} method
	 * @param {Object} options
	 */
	setupRPCOptionsForMethod(method, options) {
		if (method === "getbarteronoffersdetails") {
			// forced redirection to avoid bugs of this method before the implementation of version 0.22.16
			if (this.isProductionEnvironment()) {
				options.rpc = {
					fnode: "65.21.56.203:38081",
				};
			}
		};
	}

	sign(scope) {
		return this.sdk.sign(scope).catch(e => {
			const error = (e instanceof Error) ? e : new Error(e);
			return Promise.reject(error);
		});
	}

	/**
	 * Get logged user state
	 * 
	 * @returns {Promise}
	 */
	isLoggedIn() {
		return this.sdk.helpers.userstate().then(result => {
			this.lastresult = `isLoggedIn: ${ result }`
			return result;
		}).catch(e => this.setLastResult(e));
	}

	/**
	 * Open app settings
	 * 
	 * @returns {Promise}
	 */
	openSettings() {
		return this.sdk.helpers.opensettings().then(() => {
			this.lastresult = "opensettings: success";
			return null;
		}).catch(e => this.setLastResult(e));
	}
	
	/**
	 * Open registration page
	 * 
	 * @returns {Promise}
	 */
	openRegistration() {
		return this.sdk.helpers.registration().then(() => {
			this.lastresult = "openregistration: success";
			return null;
		}).catch(e => this.setLastResult(e));
	}

	/**
	 * Check registration and open the form if needed
	 * 
	 * @returns {Boolean}
	 */
	willOpenRegistration() {
		const result = !(this._address);
		if (result) {
			this.openRegistration();
		}
		return result;
	}

	/**
	 * Get local route from data
	 * 
	 * @param {String} route
	 * 
	 * @returns {String}
	 */
	getRoute(route) {
		return this.sdk.getroute(route);
	}

	/**
	 * Create room in chat
	 * 
	 * @param {Object} request
	 * @param {String} request.name
	 * @param {Array} request.members
	 * @param {Boolean} request.equal
	 * 
	 * @returns {Promise}
	 */
	createRoom(request) {
		if (this.isBannedUser) {
			return this.infiniteAction;
		};

		return new Promise((resolve, reject) => {
			/* Request for permissons */
			const items = ["chat"];
			this.requestPermissions(items).then(result => {
				if (result) {
					this.sdk.chat.getOrCreateRoom({
						users: request.members,
						parameters: {
							name: request.name,
							equal: request.equal
						}
					})
					.then(resolve)
					.catch(reject);
				} else {
					reject(this.disabledPermissionsError(items));
				}
			})
			.catch(reject);
		});
	}

	/**
	 * Open chat room
	 * 
	 * @param {String} roomid
	 * 
	 * @returns {Promise}
	 */
	openRoom(roomId) {
		if (this.isBannedUser) {
			return this.infiniteAction;
		};

		return this.sdk.chat.openRoom(roomId);
	}

	/**
	 * Send message to chat
	 * 
	 * @param {Object} request
	 * @param {String} request.roomid
	 * @param {Object} request.content
	 * @param {Array} request.content.messages
	 * @param {Array} request.content.images
	 * 
	 * @returns {Promise}
	 */
	sendMessageInRoom(request) {
		if (this.isBannedUser) {
			return this.infiniteAction;
		};

		return new Promise((resolve, reject) => {
			/* Request for permissons */
				const items = ["chat"];
				this.requestPermissions(items).then(result => {
					if (result) {
						this.sdk.chat.send(request)
							.then(resolve)
							.catch(reject);
					} else {
						reject(this.disabledPermissionsError(items));
					}
				})
				.catch(reject);
		});
	}

	/**
	 * Get applink from local
	 * 
	 * @param {String} url
	 * 
	 * @returns {String}
	 */
	appLink(url) {
		return this.sdk.get.applink(url);
	}

	bastyonProfileAvailable() {
		return !!(this.sdk.open.profile);
	}

	openBastyonProfile(username) {
		return this.sdk.open.profile("username", username);
	}

	/**
	 * Open external link
	 * 
	 * @param {String} url
	 * 
	 * @returns {Promise}
	 */
	openExternalLink(url) {
		if (this.isBannedUser) {
			return this.infiniteAction;
		};

		return this.sdk.openExternalLink(url).then(result => {
			this.lastresult = "openExternalLink: success"
			return result;
		}).catch(e => {
			this.setLastResult(e);
			console.error(e);
		});
	}

	/**
	 * Share resource
	 * 
	 * @param {Object} data
	 * @param {String} data.hash
	 * @param {String} data.caption
	 * @param {Array[String]} data.images
	 * 
	 * @param {Object} options
	 * 
	 * @returns {Void}
	 */
	share(data, options = { shareOnBastyon: false }) {
		if (this.isBannedUser) {
			return this.infiniteAction;
		};

		const formattedData = {
			path: `barter/${ data.hash }`,
			sharing: {
				title: "",
				text: { body: data.caption },
				images: data.images,
			},
		};

		return Promise.resolve().then(() => {
			return options?.shareOnBastyon 
				? this.sdk.helpers.shareOnBastyon(formattedData) 
				: this.sdk.helpers.share(formattedData);
		}).then(() => {
			this.lastresult = "share: success";
			return true;
		}).catch(e => this.setLastResult(e));
	}

	shareOnBastyonIsAvailable() {
		return !!(this.sdk.helpers.shareOnBastyon);
	}

	complaintIsAvailable() {
		return !!(this.sdk.helpers.complain);
	}

	openComplaintDialog(data) {
		if (this.isBannedUser) {
			return this.infiniteAction;
		};

		return this.sdk.helpers.complain(data).then(result => {
			this.lastresult = "openComplaintDialog: success"
			return result;
		}).catch(e => {
			this.setLastResult(e);
			console.error(e);
		});
	}

	/**
	 * Get image from mobile camera
	 * 
	 * @returns {Promise}
	 */
	imageFromMobileCamera() {
		return this.sdk.get.imageFromMobileCamera().then(images => {
			this.lastresult = "imageFromMobileCamera: success (console.log)"
		}).catch(e => this.setLastResult(e));
	}

	/**
	 * Show alert message
	 * 
	 * @returns {Promise}
	 */
	alertMessage(message) {
		return this.sdk.helpers.alert(message).then(() => {
			this.lastresult = "alert: success"
		}).catch(e => this.setLastResult(e));
	}

	/**
	 * Get action
	 * 
	 * @param {Object} data
	 * 
	 * @returns {Promise}
	 */
	getAction(data) {
		return this.sdk.get.action(data)
			.catch(e => this.setLastResult(e));
	}

	/**
	 * Get actions
	 * 
	 * @returns {Promise}
	 */
	getActions() {
		return this.sdk.get.actions()
			.catch(e => this.setLastResult(e));
	}

	/**
	 * Get pending offers
	 * 
	 * @returns {Promise}
	 */
	getPendingOffers() {
		return this.getActions().then(actions => {
			return Promise.all(
				(actions || [])
					.filter(action => this.isOfferAction(action))
					.filter(action => !(action.completed || action.rejected))
					.map(async action => {

						let result = null;

						const isContentDelete = (action.expObject?.type === this.txTypes.contentDelete.name);
						if (isContentDelete) {
							const txid = action.expObject?.txidEdit;
							
							if (!this.barteron.offers[txid]) {
								await this.getBrtOffersByHashes([txid]);
							}

							result = new Offer({
								...this.barteron.offers[txid],
								hash: action.transaction,
								prevhash: txid,
								published: "removed",
								relay: !action?.completed
							})
						} else {
							result = new Offer({
								/* Normal Offer action */
								...action.expObject,
								price: action.expObject?.price / 100,
								hash: action.transaction,
								prevhash: action.expObject?.hash,
								relay: !action?.completed
							})
						};

						return result;
			}) || []);
		});
	}

	/**
	 * Checking for offer action
	 * 
	 * @param {Object} action
	 * 
	 * @returns {Boolean}
	 */
	isOfferAction(action) {
		const
			expObject = action.expObject || {},
			keys = Object.keys(expObject),
			createOrEditOfferKeys = 'address,hash,language,caption,description,tag,condition,geohash'.split(','),
			deleteOfferKeys = 'txidEdit,type'.split(',');
		
		const
			isCreateOrEditOfferAction = (createOrEditOfferKeys.filter(item => !(keys.includes(item))).length == 0),
			isDeleteOfferAction = (
				deleteOfferKeys.filter(item => !(keys.includes(item))).length == 0 
				&& expObject.type === this.txTypes.contentDelete.name
			);

		return (isCreateOrEditOfferAction || isDeleteOfferAction);
	}

	/**
	 * Get vote actions
	 * 
	 * @returns {Promise}
	 */
	getVoteActions() {
		return this.getActions().then(actions => {
			return (actions || []).filter(item => this.isVoteAction(item));
		});
	}

	/**
	 * Checking for vote action
	 * 
	 * @param {Object} action
	 * 
	 * @returns {Boolean}
	 */
	isVoteAction(action) {
		const type = action.expObject?.type;
		return (type === "comment" || type === "upvoteShare");
	}

	/**
	 * Upload images to imgur
	 * 
	 * @param {Array} data
	 * @param {Array[String]} data.images
	 * @param {Boolean} errorForwarding
	 * 
	 * @returns {Promise}
	 */
	uploadImagesToImgur(data, errorForwarding) {
		if (this.isBannedUser) {
			return this.infiniteAction;
		};

		return this.sdk.images.upload(data).then(result => {
			const errorIndexes = result.reduce((acc, value, index) => {
				return (value?.url ? acc : [...acc, index]);
			}, []);

			if (errorIndexes.length) {
				const failedUploadNumbers = errorIndexes.map(m => m + 1).join(",");
				throw new Error(`images:failedUploadNumbers:${failedUploadNumbers}`);
			};

			this.lastresult = "uploadImageToImgur: success (console.log)"
			return result.map(m => m.url);
		}).catch(e => {
			this.setLastResult(e);
			if (errorForwarding) {
				throw new AppErrors.UploadImagesError(e);
			} else {
				console.error(e);
			}
		})
	}

	videoOperationsAvailable() {
		return (this.getTransactionsApiVersion() >= 4);
	}

	uploadingVideoDialog() {
		if (this.isBannedUser) {
			return this.infiniteAction;
		};

		return this.sdk.videos.opendialog().then(result => {
			this.lastresult = "uploadingVideoDialog: success"
			return result;
		}).catch(e => {
			this.setLastResult(e);
			console.error(e);
		})
	}

	getVideoInfo(urls, update = false) {
		return this.sdk.get.videos(urls, update).then(res => {
			this.lastresult = "getVideoInfo: success";

			return (res || []).map(m => {
				const
					infoExists = !!(m?.data),
					name = m?.data?.original?.name,
					state = m?.data?.original?.state,
					playlistUrl = m?.data?.original?.streamingPlaylists[0]?.playlistUrl,
					thumbnailUrl = m?.data?.thumbnail;

				return infoExists ? 
					{
						name,
						state,
						playlistUrl,
						thumbnailUrl,
					} 
					: null;
			});
		}).catch(e => {
			this.setLastResult(e);
			throw e;
		});
	}

	removeVideo(url) {
		if (this.isBannedUser) {
			return this.infiniteAction;
		};

		return this.sdk.videos.remove({url}).then(() => {
			this.lastresult = "removeVideo: success";
		}).catch(e => {
			this.setLastResult(e);
			throw e;
		});
	}

	offerMetaDataAvailable() {
		return (this.getTransactionsApiVersion() >= 6);
	}

	/**
	 * Manage bastyon image source
	 * 
	 * @param {String} src - source
	 * 
	 * @returns {String}
	 */
	manageBastyonImageSrc(src) {
		let result = src;
		if (this.sdk.manageBastyonImageSrc) {
			result = this.sdk.manageBastyonImageSrc(src);
		} else {
			if (src?.includes("bastyon.com:8092")) {
				result = src.replace("bastyon.com", "pocketnet.app");
			}
		};
		return result;
	}

	/**
	 * Check if permission is granted
	 * 
	 * @param {String} permission - Permission name
	 * 
	 * @returns {Promise}
	 */
	checkPermission(permission) {
		return this.sdk?.permissions.check({ permission }).catch(e => {
			console.error(e);
		});
	}

	/**
	 * Request permissions
	 * 
	 * @param {Array} permissions
	 * @param {Array} allowUnsigned
	 * 
	 * @returns {Promise}
	 */
	requestPermissions(permissions, allowUnsigned = ["geolocation"]) {
		return this.isLoggedIn().then(state => {
			if (!state && !permissions.filter(p => allowUnsigned.includes(p)).pop()) {
				return this.openRegistration();
			} else {
				return this.sdk.permissions.request(permissions);
			}
		});
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
			return Promise.resolve(null);
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

	safeDealAvailable() {
		return (this.getTransactionsApiVersion() >= 7);
	}

	getFromToTransactions(
		addressFrom, 
		addressTo, 
		options = { 
			update: false, 
			depth: null, 
			opreturn: null
		}
	) {
		return this.sdk.get.fromToTransactions(addressFrom, addressTo, options).then(result => {
			this.lastresult = "transactions: success";
			return result;
		}).catch(e => {
			this.setLastResult(e);
			throw e;
		});
	}

	/**
	 * Make payment
	 * 
	 * @param {Object} data
	 * @param {Array[Object]} data.recievers
	 * @param {String} data.feemode
	 * @param {String} data.message
	 * 
	 * @returns {Promise}
	 */
	makePayment(data, options = {}) {
		return this.sdk.payment(data).then(result => {
			this.lastresult = JSON.stringify(result, null, "\t");
			return result;
		}).catch(e => {
			this.setLastResult(e);
			throw new AppErrors.PaymentError(e);
		});
	}

	/**
	 * Check is app launched in bastyon
	 * 
	 * @returns {Boolean}
	 */
	inBastyon() {
		return this.sdk.inbastyon();
	}

	/**
	 * Request user location from bastyon
	 * 
	 * @param {Boolean} errorForwarding
	 * @param {Boolean} needRequestPermission
	 * 
	 * @returns {Promise}
	 */
	requestUserLocation(
		errorForwarding, 
		needRequestPermission
	) {
		return this.checkPermission("geolocation")
			.then(result => {
				return result || needRequestPermission && this.requestPermissions(["geolocation"]);
			}).catch(e => {
				this.setLastResult(e);
				if (errorForwarding) {
					throw new AppErrors.AppGeolocationPermissionError(e);
				} else {
					console.error(e);
					return false;
				}
			}).then(result => {
				if (result) {
					return this.sdk.get.geolocation().then(location => {
						this.lastresult = location;
						const latlng = Object.values(location);
						Vue.set(this, "_location", latlng);
						return latlng;
					})
				} else {
					return null;
				}
			}).catch(e => {
				this.setLastResult(e);
				if (errorForwarding) {
					throw new AppErrors.GeolocationRequestError(e);
				} else {
					console.error(e);
				}
			});
	}

	/**
	 * Currency rates from third-party API's
	 */
	getCurrency() {
		this._currency.pending = true;
		const currencyIds = currencies.map(currency => currency);
		let allRates = null;

		this.getCurrencyRates().then(rates => {
			allRates = rates;
			const 
				missingIds = currencyIds?.filter(f => !(rates[f])),
				USD_Rate = rates["USD"],
				needCalculate = missingIds?.length && USD_Rate;
			
			return needCalculate 
				? this.getMissingCurrencyСrossRates(missingIds, USD_Rate)
				: {};
		}).then(rates => {
			allRates = {
				...allRates,
				...rates,
			};
		}).catch(e => {
			console.error(e);
		}).finally(() => {
			if (allRates) {
				Vue.set(this, "_currency", allRates);
				return allRates;
			}
		});
	}

	/**
	 * Currency rates from coingecko API.
	 * The most accurate values, but some are missing.
	 */
	getCurrencyRates() {
		const 
			pkoinId = "pocketcoin",
			currencyIds = currencies.map(currency => currency);

		return fetch(`
			https://api.coingecko.com/api/v3/simple/price?
			${ new URLSearchParams({
				ids: pkoinId,
				vs_currencies: currencyIds,
			}).toString() }
		`, 
			{ timeout: 60000 }
		)
		.then(result => result.json())
		.then(data => {
			const 
				rawRates = data?.[pkoinId] || {},
				keys = Object.keys(rawRates),
				rates = keys.reduce((obj, key) => {
					obj[key.toUpperCase()] = rawRates[key];
					return obj;
				}, {});
			
			return rates;
		});
	}

	/**
	 * Currency rates from cryptocompare API.
	 * Adequate values ​​can only be obtained through 
	 * the cross rate (relative to the US dollar, for example).
	 * Direct values ​​of the PKOIN exchange rate differ 
	 * greatly from the acceptable ones.
	 */
	getMissingCurrencyСrossRates(missingCurrencyIds, USD_Rate) {
		return fetch(`
			https://min-api.cryptocompare.com/data/price?
			${ new URLSearchParams({
				fsym: "USD",
				tsyms: missingCurrencyIds
			}).toString() }
		`,
			{ timeout: 60000 }
		)
		.then(result => result.json())
		.then(data => {
			const 
				rawRates = data,
				keys = Object.keys(rawRates),
				rates = keys.reduce((obj, key) => {
					obj[key.toUpperCase()] = Number((rawRates[key] * USD_Rate).toFixed(6));
					return obj;
				}, {});

			return rates;
		});
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
	 * Get default location by time zone
	 * 
	 * @returns {Promise}
	 */
	getDefaultLocation() {
		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		const
			cityMapping = CityTimezones.cityMapping,
			city = cityMapping.filter(f => f.timezone === timeZone).sort((a, b) => a.pop - b.pop).pop();
		
		const
			country = CountriesTimezones.getCountryForTimezone(timeZone),
			countryName = country?.name;
	
		if (city?.lat || city?.lng) {
			const
				latLng = [Number(city.lat || 0), Number(city.lng || 0)],
				result = this.fixLocationIfNeeded(latLng);

			return Promise.resolve(result);

		} else if (countryName) {
			const provider = new OpenStreetMapProvider();

			return fetch(`
				${ provider.searchUrl }?
				${ new URLSearchParams({
					format: "json",
					q: countryName,
				}).toString() }
			`)
				.then(result => result.json())
				.then(data => { 
					if (data?.length > 0 && (data[0].lat || data[0].lon)) {
						const
							item = data[0],
							latLng = [Number(item.lat), Number(item.lon)];

						return this.fixLocationIfNeeded(latLng);
					} else {
						const fixedLatLng = this.fixLocationIfNeeded(null);
						return fixedLatLng || Promise.reject(new Error(`No data of lat, lon for country ${countryName}`));
					}
				})
				.catch(e => {
					this.setLastResult(e);
					return this.fixLocationIfNeeded(null);
				});
		} else {
			const fixedLatLng = this.fixLocationIfNeeded(null);
			return fixedLatLng 
				? Promise.resolve(fixedLatLng) 
				: Promise.reject(new Error(`Can't define city or country by time zone ${timeZone}`));
		}
	}

	/**
	 * Fix location if needed
	 * 
	 * @param {Array} latLng
	 * 
	 * @returns {Array}
	 */
	fixLocationIfNeeded(latLng) {
		let result = latLng;
		if (this.isBrighteonProject()) {
			const params = this.getBrighteonProjectParams();
			if (latLng && Array.isArray(latLng)) {
				const
					[lat, lng] = latLng,
					box = params.location.box;
				
				const isValid = 
					(box.minLat <= lat && lat <= box.maxLat 
						&& box.minLng <= lng && lng <= box.maxLng);
					
				result = isValid ? latLng : params.location.center;

			} else {
				result = params.location.center;
			}
		}
		return result;
	}

	/**
	 * Get brighteon project params
	 * 
	 * @returns {Object}
	 */
	getBrighteonProjectParams() {
		return {
			locale: "en-US",
			location: {
				alias: "Canada,USA",
				center: [44.966667, -103.766667],
				box: {
					minLat: 24.544622,
					minLng: -168.114716,
					maxLat: 83.095345,
					maxLng: -52.621967
				},
			},
		}
	}

	getDeliverySettings() {
		return deliverySettings;
	}

	getSafeDealSettings() {
		return safeDealSettings;
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
	 * Get their tags value from offer
	 * 
	 * @param {Object} offer
	 * @param {Object} options
	 * 
	 * @returns {Array}
	 */
	async getTheirTags(offer, options = {}) {
		let result = [];

		const
			tags = offer?.tags,
			isMyList = tags?.includes("my_list"),
			isForNothing = tags?.includes("for_nothing");

		if(isMyList) {
			const account = options?.account || (await this.getBrtAccount(offer?.address))?.[0];
			result = account?.tags;
		} else if(!isForNothing) {
			result = tags;
		}

		return result;
}

	/**
	 * Get Survey data
	 * 
	 * @returns {Promise}
	 */
	getSurveyData() {
		return new Promise((resolve, reject) => {
			if (this._address) {
				fetch(`${this.surveyURL}/check`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json;charset=utf-8'
					},
					body: JSON.stringify({address: this._address})
				}).then(
					result => result.json()
				).then(data => {
					const success = ((data?.result || "").toLowerCase() === "success");
					if (success) {
						const status = (data.status || "new");
						resolve({status});
					} else {
						reject(new Error("Survey check request failed"));
					}
				}).catch(reject);
			} else {
				resolve(null);
			}
		});
	}

	/**
	 * Set Survey data
	 * 
	 * @param {Object} data
	 * 
	 * @returns {Promise}
	 */
	setSurveyData(data) {
		if (this.isBannedUser) {
			return this.infiniteAction;
		};

		return fetch(`${this.surveyURL}/form`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json;charset=utf-8'
			},
			body: JSON.stringify(data)
		}).then(
			result => result.json()
		).then(data => {
			const success = ((data?.result || "").toLowerCase() === "success");
			if (!(success)) {
				throw new Error("Survey data request failed");
			};
		});
	}

	throwRequestIdErrorIfNeeded(checkingData, requestName) {
		if (checkingData?.checkRequestId) {
			const 
				requestSource = checkingData?.requestSource,
				requestId = checkingData?.requestId,
				ids = this.requestServiceData.ids,
				currentId = ids[requestSource],
				needReject = (requestId !== currentId);
			
			if (needReject) {
				throw new AppErrors.RequestIdError(
					requestName,
					requestSource,
					requestId, 
					currentId
				);
			}
		}
	}

	/**
	 * RPC requests
	 * 
	 * @prop {String} method
	 * @prop {Object} props
	 * 
	 * @returns {Promise}
	 */
	rpc(method, props) {
		const options = {};
		if (this.isBrighteonProject()) {
			this.setupRPCOptionsForBrighteon(options);
		} else {
			this.setupRPCOptionsForMethod(method, options);
		};
		return this.sdk.rpc(method, [props], options).then(result => {
			return this.lastresult = result;
		}).catch(e => {
			this.setLastResult(e);
			throw e;
		});
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

		if (!address) return;

		if (!this.barteron._accounts[address]) {
			new Account({ address });
		}

		return this.rpc("getbarteronaccounts", [address]).then(accounts => {
			return accounts?.map(account => new Account(account));
		});
	}

	/**
	 * Get barteron accounts
	 * 
	 * @param {Array} addresses
	 * 
	 * @returns {Promise}
	 */
	getBrtAccounts(addresses) {

		addresses = addresses || [];

		return this.rpc("getbarteronaccounts", addresses).then(items => {
			return (items || []).map(item => new Account(item));
		});
	}

	/**
	 * Get barteron offers by address
	 * 
	 * @param {String} address
	 * @param {Object} options
	 * 
	 * @returns {Promise}
	 */
	async getBrtOffers(
		address, 
		options = { disabledAverageOfferScores: false }
	) {
		if (!address && !this._address) await this.getAddress();
		address = address || this._address;

		return this.rpc("getbarteronoffersbyaddress", address).then(items => {
			const offers = items?.map(item => new Offer(item)) || [];

			if (!(options?.disabledAverageOfferScores)) {
				const offerIds = offers.map(m => m.hash);
				this.getBrtAverageOfferScores(offerIds);
			};

			return offers;
		});
	}

	/**
	 * Get barteron offers by hashes
	 * 
	 * @param {Array[String]} hashes
	 * @param {Object} options
	 * 
	 * @returns {Promise}
	 */
	getBrtOffersByHashes(
		hashes = [], 
		options = { disabledAverageOfferScores: false }
	) {
		hashes.forEach(hash => {
			if (!this.barteron._offers[hash]) {
				new Offer({ hash });
			}
		});

		if (!(options?.disabledAverageOfferScores)) {
			this.getBrtAverageOfferScores(hashes);
		};

		return this.rpc("getbarteronoffersbyroottxhashes", hashes).then(offers => {
			/* Sort to get offers in same order as requested */
			return (offers || [])
				.filter(offer => offer?.type !== this.txTypes.contentDelete.code)
				.sort((a, b) => hashes.indexOf(a.s2) - hashes.indexOf(b.s2))
				.map(offer => new Offer(offer));
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
			request?.offerIds.forEach(hash => {
				if (!this.empty(details)) {
					const data = {};

					/* Map responses with their hashes */
					for (const key in details) {
						if (key === "accounts") {
							data[key] = details[key]?.map(account => new Account(account)) || [];
						} else if (key === "offerScores") {
							data[key] = details[key]?.filter(f => f.s2 === hash).map(item => new OfferScore(item)) || [];
						} else if (key === "comments") {
							data[key] = details[key]?.filter(f => f.s3 === hash).map(item => new Comment(item)).sort((a,b) => a.time - b.time) || [];
						} else if (key === "commentScores") {
							data[key] = details[key]?.filter(f => f.s2 === hash) || [];
						}
					}

					Vue.set(this.barteron._details, hash, data);
				}
			});

			return details;
		}).catch(e => {
			console.error(e);
		});
	}
	
	/**
	 * Get barteron average offers score
	 * 
	 * @param {Array[String]} offerIds
	 * @param {Object} options
	 * 
	 * @returns {Promise}
	 */
	getBrtAverageOfferScores(
		offerIds = [], 
		options = { forceUpdate: false }
	) {
		offerIds.forEach(hash => {
			if (!this.barteron._averageOfferScores[hash]) {
				Vue.set(this.barteron._averageOfferScores, hash, {});
			}
		});

		const 
			cacheInterval = 12 * 60 * 60_000,
			nowDate = Date.now();

		const filteredIds = offerIds.filter(hash => {
			let needUpdate = false;
			const 
				item = this.barteron._averageOfferScores[hash],
				createdAt = item?.createdAt;

			if (
				options?.forceUpdate
				|| !(createdAt)
				|| createdAt && (nowDate - createdAt >= cacheInterval)
			) {
				needUpdate = true;
			}
			return needUpdate;
		})

		if (!(filteredIds.length)) {
			return;
		}

		return this.rpc("getbarteronoffersdetails", {
			offerIds: filteredIds,
			includeAccounts: false,
			includeScores: true,
			includeComments: false,
			includeCommentScores: false,
		}).then(details => {
			const offerScores = details?.offerScores;
			if (offerScores) {
				filteredIds.forEach(hash => {
					const scores = offerScores
						.filter(f => f.s2 === hash)
						.map(m => Number(m.i1))
						.filter(f => !(Number.isNaN(f)) && Number.isFinite(f));
					
					const 
						count = scores.length,
						value = scores.reduce((acc, value) => acc + value, 0) / (scores.length || 1),
						createdAt = Date.now();
					
					const data = {
						count,
						value,
						createdAt,
					};
					
					Vue.set(this.barteron._averageOfferScores, hash, data);
				});
			};

			return details;
		}).catch(e => {
			console.error(e);
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
	 * @param {Object} options
	 * 
	 * @returns {Promise}
	 */
	getBrtOffersFeed(
		request = {}, 
		options = { disabledAverageOfferScores: false }
	) {
		const checkingData = request.checkingData;
		delete request.checkingData;

		if (this.isBrighteonProject()) {
			this.setupRequestForBrighteon(request);

			const locationIsEmpty = !(request.location?.length);
			if (locationIsEmpty) {
				return Promise.resolve([]);
			}
		};

		return this.rpc("getbarteronfeed", request).then(feed => {

			this.throwRequestIdErrorIfNeeded(checkingData, "getbarteronfeed");

			const offers = feed?.map(offer => new Offer(offer)) || [];

			if (!(options?.disabledAverageOfferScores)) {
				const offerIds = offers.map(m => m.hash);
				this.getBrtAverageOfferScores(offerIds);
			};

			return offers;
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
	 * @param {Object} options
	 * 
	 * @returns {Promise}
	 */
	getBrtOfferDeals(request, options = { disabledAverageOfferScores: false }) {
		const checkingData = request.checkingData;
		delete request.checkingData;

		if (this.isBrighteonProject()) {
			this.setupRequestForBrighteon(request);

			const locationIsEmpty = !(request.location?.length);
			if (locationIsEmpty) {
				return Promise.resolve([]);
			}
		};
		
		request = {
			...request,
			myTags: (request?.myTags || []).map(tag => +tag),
			theirTags: (request?.theirTags || []).map(tag => +tag)
		};

		return this.rpc("getbarterondeals", request).then(deals => {

			this.throwRequestIdErrorIfNeeded(checkingData, "getbarterondeals");

			const offers = deals?.map(offer => new Offer(offer)) || [];

			if (!(options?.disabledAverageOfferScores)) {
				const offerIds = offers.map(m => m.hash);
				this.getBrtAverageOfferScores(offerIds);
			};

			return offers;
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
		const checkingData = request.checkingData;
		delete request.checkingData;

		if (this.isBrighteonProject()) {
			this.setupRequestForBrighteon(request);

			const locationIsEmpty = !(request.location?.length);
			if (locationIsEmpty) {
				return Promise.resolve([]);
			}
		};

		request = {
			...request,
			myTag: +request?.myTag,
			theirTags: (request?.theirTags || []).map(tag => +tag)
		};

		return this.rpc("getbarteroncomplexdeals", request).then(data => {

			this.throwRequestIdErrorIfNeeded(checkingData, "getbarteroncomplexdeals");

			data?.map(match => {
				if (match.target) {
					match.target = new Offer(match.target);
					match.intermediates = match?.intermediates.map(offer => new Offer(offer)) || [];
				}
			});

			return data;
		});
	}

	/**
	 * Set to barteron account
	 * 
	 * @param {Object} data
	 * @param {String} data.address
	 * @param {Array} data.tags
	 * @param {String} data.geohash
	 * @param {Number} data.radius
	 * 
	 * @returns {Promise}
	 */
	setBrtAccount(data) {
		if (this.isBannedUser) {
			return this.infiniteAction;
		};

		return this.sdk.barteron.account(data).then(result => result);
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
		if (this.isBannedUser) {
			return this.infiniteAction;
		};

		return this.sdk.barteron.offer({
			...data,
			...{ hash: data.hash?.length === 64 ? data.hash : null }
		}).then(action => {
			this.offerUpdateActionId = action.id;
			return action;
		});
	}

	/**
	 * Remove an Offer
	 * 
	 * @param {String} param0
	 */
	delBrtOffer({ hash }) {
		if (this.isBannedUser) {
			return this.infiniteAction;
		};

		return this.sdk.barteron.removeOffer({ hash }).then(action => {
			this.offerUpdateActionId = action.id;
			return action;
		});
	}

	/**
	 * Set barteron offer vote
	 * 
	 * @param {Object} data
	 * 
	 * Base
	 * 
	 * @param {String} data.offerId
	 * @param {String} data.value
	 * @param {String} data.address
	 * 
	 * @returns {Promise}
	 */
	setBrtOfferVote(data) {
		if (this.isBannedUser) {
			return this.infiniteAction;
		};

		return this.sdk.barteron.vote({
			share: data.offerId,
			vsaddress: data.address,
			value: data.value
		});
	}

	/**
	 * Set barteron offer comment
	 * 
	 * @param {Object} data
	 * 
	 * Base
	 * 
	 * @param {String} data.postid
	 * @param {Object} data.msg
	 * @param {String} data.msg.message
	 * @param {String} data.msg.info
	 * @param {String} [data.parentid]
	 * @param {String} [data.answerid]
	 * 
	 * @returns {Promise}
	 */
	setBrtComment(data) {
		if (this.isBannedUser) {
			return this.infiniteAction;
		};

		return this.sdk.barteron.comment(data);
	}
}

export default SDK;
