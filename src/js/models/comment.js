import Vue from "vue";

/**
 * Comment object model
 * 
 * @class Comment
 */
class Comment {
	/**
	 * Initialize model
	 * 
	 * @constructor Account
	 * @param {Object} data
	 */
	constructor(data) {
		/* Extract JSON values and format object */
		const { message, info } = JSON.parse(data?.p?.s1 || '{"message":"", "info":""}');
		
		/* Iterable properties */
		this.hash = data?.hash || data?.hash || null;
		this.height = data?.height || 0;
		this.type = data?.type || 0;
		this.postid = data?.s3 || data?.postid || "";
		this.parentid = data?.parentid || "";
		this.address = data?.s1 || data?.address || "";
		this.message = data?.p?.s1 ? message : data?.message || "";
		this.info = data?.p?.s1 ? info : data?.info || "";

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
			throw new Error('Comment item hash is undefined');
		}

		const alreadyExists = (this.sdk.barteron._comments[this.hash] instanceof Comment);
		if (alreadyExists) {
			return this.sdk.barteron._comments[this.hash].update(this);
		} else {
			Vue.set(this.sdk.barteron._comments, this.hash, this);
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
					target = this.sdk.barteron._comments[this.hash],
					props = {
						relay: !(action?.completed || action?.rejected),
						completed: action?.completed,
						rejected: action?.rejected,
					};

				Object.entries(props).forEach(([key, value]) => {
					Vue.set(target, key, value);
				});
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
		Vue.delete(this.sdk.barteron._comments, this.hash);
	}
};

export default Comment;