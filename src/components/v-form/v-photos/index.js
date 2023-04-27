export default {
	name: "Vphotos",

	props: {
		
	},

	data() {
		return {
			files: new FormData(),
			count: 0
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
		async uploadImage(e) {
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