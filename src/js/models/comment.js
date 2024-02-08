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
		const { message } = JSON.parse(data?.p?.s1 || '{"message":""}');
		
		/* Iterable properties */
		this.hash = data?.hash || data?.hash || null;
		this.height = data?.height || 0;
		this.message = data?.p?.s1 ? message : data?.message;
		this.address = data?.s1 || "";
		this.postid = data?.s3 || data?.postid || "";
		this.parentid = data?.parentid || "";
		this.type = data?.type || 0;

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

		Vue.set(this.sdk.barteron._comments, this.hash, this);
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
	 * Store model data
	 * 
	 * @param {Object} [data]
	 */
	set(data) {
		return this.sdk.setBrtComment({ ...this.update(data) });
	}

	/**
	 * Destroy model data
	 */
	destroy() {
		Vue.delete(this.sdk.barteron._comments, this.hash);
	}
};

export default Comment;