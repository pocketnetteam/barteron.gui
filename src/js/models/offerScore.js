import Vue from "vue";

/**
 * Offer score object model
 * 
 * @class OfferScore
 */
class OfferScore {
	/**
	 * Initialize model
	 * 
	 * @constructor Account
	 * @param {Object} data
	 */
	constructor(data) {
		/* Iterable properties */
		this.hash = data?.hash;
		this.height = data?.height || 0;
		this.type = data?.type || 0;
		this.address = data?.s1 || data?.address || "";
        this.offerId = data?.s2 || data?.offerId || "";
		this.value = data?.i1 ? +data?.i1 : data?.value || "";

		const
			isMs = (timestamp) => {
				const date = new Date(timestamp);
				return isNaN(date) || Math.abs(Date.now() - date) < Math.abs(Date.now() - date * 1000);
			},
			time = isMs(data?.time) ? +new Date : data?.time * 1000;

		/* Hidden properties */
		Object.defineProperties(this, {
			sdk: { value: Vue.prototype.sdk },
			time: { value: time }
		});

		this.relay = data?.relay || false;
		this.rejected = data?.rejected || false;
		this.completed = data?.completed || !(this.relay || this.rejected);

		this.actionHandler = null;

		if (!(this.hash)) {
			throw new Error('Offer score item hash is undefined');
		}

		const alreadyExists = (this.sdk.barteron._offerScores[this.hash] instanceof OfferScore);
		if (alreadyExists) {
			return this.sdk.barteron._offerScores[this.hash].update(this);
		} else {
			Vue.set(this.sdk.barteron._offerScores, this.hash, this);
			this.action();
		}
	}

	/**
	 * Watch action status
	 */
	action() {
		this.actionHandler = (action) => {
			if (this.hash === action.transaction) {
				const
					target = this.sdk.barteron._offerScores[this.hash],
					props = {
						relay: !(action?.completed || action?.rejected),
						completed: action?.completed,
						rejected: action?.rejected,
					},
					needUpdateAverageOfferScore = (this.offerId && props.completed && !(this.completed));

				Object.entries(props).forEach(([key, value]) => {
					Vue.set(target, key, value);
				});

				if (needUpdateAverageOfferScore) {
					this.sdk.getBrtAverageOfferScores([this.offerId], {forceUpdate: true});
				};
			}
		}

		this.sdk.on("action", this.actionHandler);
	}

	/**
	 * Update model properties
	 * 
	 * @param {Object} [data]
	 * 
	 * @returns {Account}
	 */
	update(data) {
		if (Object.keys(data || {}).length) {
			for (const p in data) {
				this[p] = data[p];
			}
		}

		return this;
	}

	/**
	 * Destroy model data
	 */
	destroy() {
		this.sdk.off("action", this.actionHandler);
		this.actionHandler = null;
		Vue.delete(this.sdk.barteron._offerScores, this.hash);
	}
};

export default OfferScore;