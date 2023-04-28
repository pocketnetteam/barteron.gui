export default {
	name: "Vphotos",

	props: {
		multiple: String,
		accept: String /* File extensions with comma - gif, jpeg, png */
	},

	data() {
		return {
			files: new FormData(),
			count: 0
		}
	},

	computed: {
		mimeTypes() {
			return (this.accept?.replace(" ", "").split(",") || []).reduce((a, t) => {
				switch(t) {
					/* Image mime types */
					case "avif": t = "image/avif"; break;
					case "gif": t = "image/gif"; break;
					case "icon": t = "image/x-icon"; break;
					case "jpeg": t = "image/jpeg"; break;
					case "apng": t = "image/apng"; break;
					case "png": t = "image/png"; break;
					case "svg": t = "image/svg+xml"; break;
					case "tiff": t = "image/tiff"; break;
					case "bmp": t = "image/bmp"; break;
					case "wbmp": t = "image/vnd.wap.wbmp"; break;
					case "webp": t = "image/webp"; break;
				}

				a.push(t);
				return a;
			}, []).join(", ");
		}
	},

	methods: {
		/**
		 * Make hash based on timestamp
		 * 
		 * @param {Number} slug 
		 * @returns 
		 */
		hash(slug) {
			return (+new Date + slug).toString(16);
		},

		/**
		 * Upload image preprocessor
		 */
		uploadImage(e) {
			[...e.target.files].forEach((file, index) => {
				const reader = new FileReader();

				reader.onload = (e) => {
					file.base64 = e.target.result;
					this.files.append(`image-${ this.hash(index) }`, file);
					this.count++;
				}

				reader.readAsDataURL(file);
			});
		},

		/**
		 * Remove image handler
		 */
		remove(e, key) {
			this.files.delete(key);
			if (this.count > 0) this.count--;
		}
	}
}