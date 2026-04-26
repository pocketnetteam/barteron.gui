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
			rotating: [],
			max: parseInt(this.maxLen) || 0,
			drag: false,
			moving: null,
			log: [],
			logLength: 5,
			logDisappear: 5000
		}
	},

	computed: {
		allMimeTypes() {
			return {
				"avif": "image/avif",
				"gif":  "image/gif",
				"icon": "image/x-icon",
				"jpg":  "image/jpeg",
				"jpeg": "image/jpeg",
				"apng": "image/apng",
				"png":  "image/png",
				"svg":  "image/svg+xml",
				"tiff": "image/tiff",
				"bmp":  "image/bmp",
				"wbmp": "image/vnd.wap.wbmp",
				"webp": "image/webp",
			};
		},

		/**
		 * Convert given extensions to mime types
		 * 
		 * @returns {String}
		 */
		mimeTypes() {
			return (this.accept?.replace(" ", "").split(",") || []).reduce((a, t) => {
				t = this.allMimeTypes[t] || t;
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
		 * Drop event handler
		 * 
		 * @param {DragEvent} e
		 */
		drop(e) {
			const files = e.dataTransfer?.files
			if (files?.length) {
				this.prepare({ target: { files } });
				e.preventDefault()
			}
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
			e?.stopPropagation();
			this.files.splice(index || 0, e === undefined ? this.files.length : 1);
			if (e) this.log.add(this.$t("photosLabels.detatched"));

			return this;
		},

		rotate(e, index) {
			e?.preventDefault();
			e?.stopPropagation();

			const item = this.files[index];

			if (this.isRotating(item)) {
				return;
			};
			
			this.rotating.push(item.id);

			this.rotateItem(item, 90).then(result => {
				const currentIndex = this.files.findIndex(f => f.id === item.id);
				if (currentIndex >= 0) {
					this.$set(this.files, currentIndex, {
						...item,
						image: result.newBase64,
						file: result.rotatedFile
					});
				};
			}).catch(e => {
				this.log.add(e.message, "error");
			}).finally(() => {
				this.rotating = this.rotating.filter(f => f !== item.id);
			});
		},

		isRotating(item) {
			return this.rotating.some(f => f === item?.id);
		},

		async rotateItem(item, degrees = 90) {
			return new Promise((resolve, reject) => {
				const img = new Image();
				img.crossOrigin = "Anonymous";
				img.onload = () => {
					try {
						const canvas = document.createElement("canvas");
						const ctx = canvas.getContext("2d");

						if (degrees % 180 !== 0) {
							[canvas.width, canvas.height] = [img.height, img.width];
						} else {
							[canvas.width, canvas.height] = [img.width, img.height];
						}

						ctx.translate(canvas.width / 2, canvas.height / 2);
						ctx.rotate((degrees * Math.PI) / 180);
						ctx.drawImage(img, -img.width / 2, -img.height / 2);

						const params = {
							quality: 0.9,
						};

						if (item.file) {
							params.fileType = item.file?.type;
							params.fileName = item.file?.name;
						} else if (item.image?.startsWith("http")) {
							const 
								urlPath = new URL(item.image).pathname,
								fileName = urlPath.substring(urlPath.lastIndexOf('/') + 1),
								extension = fileName.split('.').pop().toLowerCase(),
								fileType = this.allMimeTypes[extension] || "image/jpeg";

							params.fileName = fileName;
							params.fileType = fileType;
						} else {
							reject(new Error("Can't read file type"));
						};

						const newBase64 = canvas.toDataURL(params.fileType, params.quality);

						canvas.toBlob((blob) => {
							const rotatedFile = new File([blob], params.fileName, {
								type: params.fileType,
								lastModified: Date.now(),
							});

							resolve({
								newBase64,
								rotatedFile
							});
						}, params.fileType, params.quality);
					} catch (e) {
						reject(e);
					};
				};
				img.onerror = () => reject(new Error("Can't load file"));
				img.src = item.image;
			});
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
				return this.files.length && this.files.length <= this.max;
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
			this.files = [];
			this.attach(images, { disableLog: true });
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

			this.filesSizeCalculated = false;

			Promise.all(promises).catch(e => { 
				console.error(e);
			}).finally(() => {
				this.filesSizeCalculated = true;
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
	},

	mounted() {
		/* Add event listeners */
		this.onDragOver = (e) => this.dragToggle(e, { preventDefault: true });
		this.onDragLeave = (e) => this.dragToggle(e);
		this.onDrop = (e) => this.dragToggle(e);

		document.addEventListener("dragover", this.onDragOver);
		document.addEventListener("dragleave", this.onDragLeave);
		document.addEventListener("drop", this.onDrop);
	},

	beforeDestroy() {
		document.removeEventListener("dragover", this.onDragOver);
		document.removeEventListener("dragleave", this.onDragLeave);
		document.removeEventListener("drop", this.onDrop);
	}
}