export default {
	name: "Vphotos",

	props: {
		
	},

	data() {
		return {
			formData: new FormData()
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
		async uploadImage() {
			[...this.$refs.file.files].forEach((item, index) => {
				this.formData.append(`image-${ this.hash(index) }`, item);
			});

			for (const key of this.formData.keys()) {
				console.log(key, this.formData.get(key));
			}
		}
	}
}