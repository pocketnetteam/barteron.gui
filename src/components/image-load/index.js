export default {
	name: "ImageLoad",

	data() {
		return {
			image: false,
			loader: false,
			error: false
		}
	},

	methods: {
		/**
		 * Extract url from background property
		 * 
		 * @param {String} url
		 * 
		 * @returns {String}
		 */
		extractUrl(url) {
			return url.includes("url") ? url.match(/url\((.+)\)/)?.[1] : url;
		},

		/**
		 * Load image
		 * 
		 * @param {String} src
		 */
		loadImage(src) {
			if (src) {
				const image = new Image();

				image.src = src;

				image.onload = () => {
					this.loader = false;
					this.image = true;
				}

				image.onerror = () => {
					this.loader = false;
					this.error = true;
				}

				this.loader = true;
			} else {
				this.error = true;
			}
		}
	},

	mounted() {
		const
			attrs = ["src", "data-src", "style"],
			img = this.$slots.image;

		img.reduce((child, { data }) => {
			if (data.attrs || data) {
				Object.keys(data.attrs || data).every(attr => {
					if (attrs.includes(attr)) {
						img.src = this.extractUrl((data.attrs || data)?.[attr]);
						return false;
					} else {
						return true;
					}
				});
			}
		}, false);

		this.loadImage(img.src);
	}
}