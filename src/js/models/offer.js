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
	 * @param {Object} data
	 */
	constructor(data) {
		/* Extract JSON values and format object */
		const
			{ t, a, c, p, d, f, v } = JSON.parse(data?.p?.s4 || '{"t":"","a":[],"c":"new","p":"published","d":{},"f":{},"v":{}}'),
			images = JSON.parse(data?.p?.s5 || "[]");
		
		/* Iterable properties */
		this.address = data?.address || data?.s1 || "";
		this.hash = data?.s2 || data?.hash || null;
		this.firsthash = data?.s2 && data?.hash ? data.hash : null;
		this.prevhash = data?.prevhash || null;
		this.language = data?.language || data?.p?.s1 || "";
		this.caption = data?.caption || data?.p?.s2 || "";
		this.description = data?.description || data?.p?.s3 || "";
		this.tag = data?.tag || t || null;
		this.tags = (data?.tags || a || []).map(tag => !isNaN(+tag) ? +tag : tag);
		this.condition = data?.condition || c || "new";
		this.images = (data?.images || images || []).filter(f => f);
		this.delivery = (data?.delivery ?? d ?? {});
		this.videoSettings = (data?.videoSettings ?? v ?? {});
		this.geohash = data?.geohash || data?.p?.s6 || "";
		this.video = data?.video || data?.p?.s7 || "";
		this.currencyPrice = data?.currencyPrice || f || {};
		this.price = (data?.price || data?.p?.i1 / 100 || 0);
		this.published = (data?.published ?? p ?? "published"); // published, withdrawed, removed

		const
			isMs = (timestamp) => {
				const date = timestamp ? new Date(timestamp) : NaN;
				return isNaN(date) || Math.abs(Date.now() - date) < Math.abs(Date.now() - date * 1000);
			},
			time = isMs(data?.time) ? +new Date : data?.time * 1000,
			date = new Date(time),
			height = data?.height,
			till = data?.till || date.setFullYear(date.getFullYear() + 1);

		/* Hidden properties */
		Object.defineProperties(this, {
			sdk: { value: Vue.prototype.sdk },
			time: { value: time, writable: true, enumerable: true },
			height: {value: height, writable: true, enumerable: true },
			till: { value: till, writable: true, enumerable: true }
		});

		this.relay = data?.relay || false;

		/* If already exists */
		if (this.sdk.barteron._offers[this.hash] instanceof Offer) {
			return this.sdk.barteron._offers[this.hash].update(this);
		}

		/* Initialize access */
		Vue.set(
			this.sdk.barteron._offers,
			this.hash || "draft",
			this.update({ hash: this.hash || "draft" })
		);

		/* Watch for action */
		this.action();
	}

	/**
	 * Is offer active computed property
	 * 
	 * @returns {Boolean}
	 */
	get active() {
		return (
			this.published == "published" &&
			this.till > +new Date
		);
	}

	/**
	 * Offer status computed property
	 * 
	 * @returns {String}
	 */
	get status() {
		const state = [];

		state.unshift("valid");

		if (!this.hash || this.hash === "draft") {
			state.unshift("draft");
		}

		if (this.till < +new Date) {
			state.unshift("outdated");
		}

		if (this.relay) {
			switch(this.published) {
				case "withdrawed": {
					state.unshift("withdrawed");
					break;
				}
	
				case "removed": {
					state.unshift("removed");
					break;
				}
	
				default: {
					state.unshift("published");
				}
			}
		} else {
			if (this.published === "removed") {
				state.unshift("removed");
			}
		}

		return state.shift();
	}

	/**
	 * Is pickup point computed property
	 * 
	 * @returns {Boolean}
	 */
	get isPickupPoint() {
		return this.tag === 97;
	}

	/**
	 * Watch action status
	 */
	action() {
		this.sdk.on("action", action => {
			if (this.hash === action.transaction) {
				const statusBefore = this.status;
				const props = {
					relay: (!!action?.relay && !action?.completed),
				};
				Vue.set(
					this.sdk.barteron._offers[this.hash],
					"relay",
					props.relay
				);
				const statusAfter = this.status;

				const offerHasPublished = (statusBefore === "published" && statusAfter === "valid");
				if (offerHasPublished) {
					this.sdk.lastPublishedOfferId = this.hash;
				};
			}
		});
	}

	/**
	 * Update model properties
	 * 
	 * @param {Object} [data]
	 * 
	 * @returns {Offer}
	 */
	update(data) {
		if (Object.keys(data || {}).length) {
			/* Iterate given props */
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
	 * 
	 * @returns {Promise}
	 */
	set(data) {
		return this.sdk.setBrtOffer({
			...this.update(data),
			price: parseInt(this.price * 100)
		}).then(action => {
			const
				txid = (this.hash?.length === 64 ? this.hash : action.transaction),
				hash = this.hash;

			/* Create new key in storage when hash had changed */
			if (txid && hash && txid !== hash) {
				this.update({ hash: txid });

				Vue.set(this.sdk.barteron._offers, txid, this);
				Vue.delete(this.sdk.barteron._offers, hash);
			}

			return action;
		});
	}

	/**
	 * Remove an Offer from node
	 * 
	 * @returns {Promise}
	 */
	remove() {
		return this.sdk.delBrtOffer(this);
	}

	/**
	 * Destroy model data
	 */
	destroy() {
		Vue.delete(this.sdk.barteron._offers, this.hash);
	}
};

export default Offer;