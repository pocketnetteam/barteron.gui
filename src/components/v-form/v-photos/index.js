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
			filesSizeCalculated: false,
			max: parseInt(this.maxLen) || 0,
			drag: false,
			moving: null,
			log: [],
			logLength: 5,
			logDisappear: 5000
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
				cdata = e.clipboardData || e.originalEvent.clipboardData,
				items = cdata.items,
				text = cdata.getData("text"),
				files = [];

			if (items.length) {
				for (const item of items) {
					/* Parse raw data */
					if (item.type.includes("image")) {
						files.push(item.getAsFile());
					}
	
					/* Parse url */
					if (item.type.includes("text") && text.includes("http")) {
						fetch(text)
							.then(response => {
								if (!response.ok) {
									this.log.add(this.$t("photosLabels.error_connection"), "error");
								}
	
								return response.text();
							})
							.then(data => {
								files.push(data);
							})
							.catch(() => {
								this.log.add("Error fetching url", "error");
							});
					}
				}
	
				if (files.length) this.prepare({ target: { files } });
				else this.log.add(this.$t("photosLabels.error_paste"), "error");
			} else {
				this.log.add(this.$t("photosLabels.error_paste"), "error");
			}
		},

		/**
		 * Attach image to query
		 * 
		 * @param {Object|Array} images
		 * 
		 * @returns {Vphotos}
		 */
		attach(images, options = { disableLog: false }) {
			if (Array.isArray(images)) {
				images.forEach(image => {
					if (!this.isExist(image)) {
						this.files.push({
							id: `image-${ this.hash() }`,
							image
						});

						if (!options?.disableLog) {
							this.log.add(this.$t("photosLabels.attached"), "success");
						}
					}
				});
			} else if (!this.isExist(images.image)) {
				this.files.push({
					id: `image-${ this.hash() }`,
					...images
				});

				if (!options?.disableLog) {
					this.log.add(this.$t("photosLabels.attached"), "success");
				}
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
			if (e) this.log.add(this.$t("photosLabels.detatched"));

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
			const 
				listElement= e.target.parentNode,
				index = Array.prototype.indexOf.call(listElement.childNodes, e.target)
			
			this.moving = this.files[index];
		},

		/**
		 * Process dragMove
		 * 
		 * @param {DragEvent} e
		 */
		dragToggle(e, options = { preventDefault: false }) {
			if (options?.preventDefault) {
				e.preventDefault()
			}

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
		 * Format bytes
		 * 
		 * @param {Number|String} bytes
		 * @param {Number} decimals
		 * 
		 * @returns {String}
		 */
		formatBytes(bytes, decimals = 2) {
			if (!+bytes) return `0 ${ this.$t('metricsLabels.bytes') }`

			const
				k = 1024,
				dm = decimals < 0 ? 0 : decimals,
				sizes = ['bytes', 'kb', 'mb', 'gb', 'tb', 'pb', 'eb', 'zb', 'yb'],
				i = Math.floor(Math.log(bytes) / Math.log(k));

			return `${ parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) } ${ this.$t(`metricsLabels.${ sizes[i] }`) }`
		},

		/**
		 * Check at least one photo attached
		 */
		validate() {
			if (!this.max) {
				return this.files.length;
			} else {
				return this.files.length && this.files.length < this.max;
			}
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
		},

		/**
		 * Watch for files property
		 * 
		 * @param {Array|Object} files
		 */
		files() {
			const promises = this.files.filter(item => !(item.fileSize)).map(item => {

				return new Promise((resolve) => {

					const isImageData = (item.image.indexOf('data:') == 0)
					if (isImageData) {
						item.fileSize = item.image.length
						resolve()
					} else {

						fetch(item.image, {method: 'HEAD'}).then((response) => {
							if (response.ok) {
								item.fileSize = parseInt(response.headers.get('content-length'))
							} else {
								this.log.add(this.$t("photosLabels.error_connection"), "error");
							}
						}).catch(() => {
							this.log.add("Error fetching url", "error");
						}).finally(() => {
							resolve()
						})
					}
				})
			})

			this.filesSizeCalculated = false

			Promise.all(promises).catch(e => { 
				console.error(e);
			}).finally(() => {
				this.filesSizeCalculated = true
			});
		},

		/**
		 * Watch for log events
		 */
		log() {
			if (this.log.length > this.logLength) {
				this.log.splice(this.log.length - this.logLength, this.log.length - this.logLength);
			}
		}
	},

	created() {
		/* Define log methods */
		this.log.add = (text, type = "normal") => {
			const timestamp = +new Date();

			this.log.push({
				text,
				type,
				timestamp
			});

			setTimeout(() => {
				const index = this.log.findIndex(i => i.timestamp === timestamp);
				if (index > -1) this.log.remove(index);
			}, this.logDisappear);
		}

		this.log.remove = (index) => {
			this.log.splice(index, 1);
		}

		/* Add images from properties */
		this.attach(this.images, { disableLog: true });
		
		/* Add event listeners */
		document.addEventListener("dragover", e => this.dragToggle(e, { preventDefault: true }));
		document.addEventListener("dragleave", e => this.dragToggle(e));
		document.addEventListener("drop", e => this.dragToggle(e));
	},
}