export default {
	name: "Vphotos",

	props: {
		multiple: String,
		accept: String,
		maxLen: String,
		images: {
			type: Array,
			default: () => []
		}
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
			}, []);
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

		/**
		 * Prepare image to query
		 * 
		 * @param {Event} e
		 */
		prepare(e) {
			[...e.target.files].forEach(file => {
				const reader = new FileReader();

				reader.onload = e => {
					/* Check if maxLen disabled or files count less than maxLen */
					if (
						(!this.max || this.files.length < this.max) &&
						new RegExp(`data:(${ this.mimeTypes.join("|") })`).test(e.target.result)
					) {
						this.attach({
							image: e.target.result,
							file
						});
					}
				}

				reader.readAsDataURL(file);
			});

			e.target.value = "";
		},

		/**
		 * Get images from Clipboard
		 * 
		 * @param {ClipboardEvent} e
		 */
		clipboard(e) {
			const 
				items = (e.clipboardData || e.originalEvent.clipboardData).items,
				files = [];

			for (const item of items) {
				if (item.type.includes('image')) {
					files.push(item.getAsFile());
				}
			}

			this.prepare({ target: { files } });
		},

		/**
		 * Attach image to query
		 * 
		 * @param {Object|Array} images
		 * 
		 * @returns {Vphotos}
		 */
		attach(images) {
			if (Array.isArray(images)) {
				images.forEach(image => {
					if (!this.isExist(image)) {
						this.files.push({
							id: `image-${ this.hash() }`,
							image
						});
					}
				});
			} else if (!this.isExist(images.image)) {
				this.files.push({
					id: `image-${ this.hash() }`,
					...images
				});
			}

			return this;
		},

		/**
		 * Detatch image from query
		 * 
		 * @param {Event} e
		 * @param {Number} index
		 * 
		 * @returns {Vphotos}
		 */
		detatch(e, index) {
			e?.preventDefault();
			this.files.splice(index || 0, e === undefined ? this.files.length : 1);

			return this;
		},

		/**
		 * Make image first in query
		 * 
		 * @param {Number} index
		 */
		makeFirst(index) {
			const item = this.files[index];
			this.detatch(null, index);
			this.files = [item].concat(this.files);
		},

		/**
		 * Check if image already exists in query
		 * 
		 * @param {String} image
		 * 
		 * @returns {Object}
		 */
		isExist(image) {
			return this.files.filter(file => file.image === image)?.pop();
		},

		/**
		 * Proccess dragStart
		 * 
		 * @param {DragEvent} e
		 */
		dragStart(e) {
			this.moving = this.files[e.target.dataset.index];
		},

		/**
		 * Process dragMove
		 * 
		 * @param {DragEvent} e
		 */
		dragToggle(e) {
			if (this.moving && e?.target.dataset.index) {
				const 
					newIndex = e.target.dataset.index,
					oldIndex = this.files.findIndex(file => file === this.moving);

				this.files.splice(newIndex, 0, this.files.splice(oldIndex, 1)[0]);
			}

			this.drag = e?.type === "dragover";
		},

		/**
		 * Process dragEnd
		 */
		dragEnd() {
			this.moving = null;
		},

		/**
		 * Check at least one photo attached
		 */
		validate() {
			return this.files.length;
		},

		/**
		 * Serialize files to FormData
		 * 
		 * @returns {Object}
		 */
		serialize() {
			const formData = new FormData();

			this.files.forEach(file => formData.append(file.id, file.image));

			return Object.fromEntries(formData.entries());
		}
	},

	watch: {
		/**
		 * Watch for images property
		 * 
		 * @param {Array|Object} images
		 */
		images(images) {
			this.attach(images);
		}
	},

	created() {
		this.attach(this.images);
		
		document.addEventListener("dragover", e => this.dragToggle(e));
		document.addEventListener("dragleave", e => this.dragToggle(e));
		document.addEventListener("drop", e => this.dragToggle(e));
	},
}