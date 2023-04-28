export default {
	name: "Vphotos",

	props: {
		multiple: String,
		accept: String /* File extensions with comma - gif, jpeg, png */
	},

	data() {
		return {
			files: []
		}
	},

	computed: {
		/**
		 * Convert given extensions to mime types
		 * 
		 * @return {String}
		 */
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
		 */
		hash(slug) {
			return (+new Date + slug).toString(16);
		},

		/**
		 * Upload image preprocessor
		 * 
		 * @param {Event} e
		 */
		uploadImage(e) {
			[...e.target.files].forEach((file, index) => {
				const reader = new FileReader();

				reader.onload = (e) => {
					this.files.push({
						id: `image-${ this.hash(index) }`,
						image: e.target.result,
						file: file
					});
				}

				reader.readAsDataURL(file);
			});

			e.target.value = "";
		},

		/**
		 * Remove image handler
		 * 
		 * @param {Number} index
		 */
		remove(index) {
			this.files.splice(index, 1);
		},

		/**
		 * Serialize files for form
		 * 
		 * @return {FormData}
		 */
		serialize() {
			const formData = new FormData();

			for (const index in this.files) {
				formData.append(index[index].id, this.files[index].file);
			}

			return formData;
		}
	}
}