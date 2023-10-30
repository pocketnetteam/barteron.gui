export default {
	name: "Vphotos",

	props: {
		multiple: String, /* Allow upload multiple files at once */
		accept: String, /* File extensions with comma - gif, jpeg, png */
		maxLen: String /* Count of maximum photos */
	},

	data() {
		return {
			files: [],
			max: parseInt(this.maxLen) || 0,
			drag: false,
			moving: null
		}
	},

	computed: {
		/**
		 * Convert given extensions to mime types
		 * 
		 * @returns {String}
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
		 * Make hash
		 * 
		 * @returns {String}
		 */
		hash() {
			return Math.random().toString(16).slice(2);
		},

		dragtoggle(e) {
			if (this.moving && e?.target.dataset.index) {
				const 
					newIndex = e.target.dataset.index,
					oldIndex = this.files.findIndex(file => file === this.moving);

				this.files.splice(newIndex, 0, this.files.splice(oldIndex, 1)[0]);
			}
			this.drag = e?.type === "dragover";
		},

		dragStart(e) {
			this.moving = this.files[e.target.dataset.index];
		},

		dragEnd() {
			this.moving = null;
		},

		/**
		 * Upload image preprocessor
		 * 
		 * @param {Event} e
		 */
		upload(e) {
			[...e.target.files].forEach((file, index) => {
				const reader = new FileReader();

				reader.onload = (e) => {
					/* Check if maxLen disabled or files count less than maxLen */
					if (!this.max || this.files.length < this.max) {
						this.add({
							image: e.target.result,
							file: file
						});
					}
				}

				reader.readAsDataURL(file);
			});

			e.target.value = "";
		},

		/**
		 * Add image handler
		 * 
		 * @param {Object|Array} images
		 * 
		 * @returns {Vphotos}
		 */
		add(images) {
			if (Array.isArray(images)) {
				images.forEach(image => {
					this.files.push({
						id: `image-${ this.hash() }`,
						image
					});
				});
			} else {
				this.files.push({
					id: `image-${ this.hash() }`,
					...images
				});
			}

			return this;
		},

		/**
		 * Remove image handler
		 * 
		 * @param {Event} e
		 * @param {Number} index
		 * 
		 * @returns {Vphotos}
		 */
		remove(e, index) {
			e?.preventDefault();
			this.files.splice(index || 0, e === undefined ? this.files.length : 1);

			return this;
		},

		/**
		 * Make image first
		 * 
		 * @param {Number} index 
		 */
		makeFirst(index) {
			const item = this.files[index];
			this.remove(null, index);
			this.files = [item].concat(this.files);
		},

		/**
		 * Check at least one photo attached
		 */
		validate() {
			return this.files.length;
		},

		/**
		 * Serialize files for form
		 * 
		 * @returns {Object}
		 */
		serialize() {
			const formData = new FormData();

			this.files.forEach(file => formData.append(file.id, file.image));

			return Object.fromEntries(formData.entries());
		}
	},

	created() {
		document.addEventListener("dragover", e => this.dragtoggle(e));
		document.addEventListener("dragleave", e => this.dragtoggle(e));
		document.addEventListener("drop", e => this.dragtoggle(e));
	},
}