export default {
	name: "Contacts",

	/**
	 * Field description
	 * 
	 * @typedef {Object} Field
	 * 
	 * @prop {String} type Field type
	 * @prop {String} value Field value
	 * @prop {String} [icon] Field icon (not required)
	 */

	/**
	 * Define component props
	 * 
	 * @type {Object}
	 * 
	 * @prop {String} hash (required)
	 * @prop {Boolean} [canEdit] (not required, default: false)
	 */
	props: {
		hash: {
			type: String,
			required: true
		},
		canEdit: {
			type: Boolean,
			default: false
		}
	},

	data() {
		return {
			/** @type {Array<Field>} */
			contacts: [],

			/**
			 * Define known type of fields
			 * 
			 * @type {Object}
			 * 
			 * @prop {String} email
			 * @prop {String} phone
			 * @prop {String} telegram
			 * @prop {String} whatsapp
			 * @prop {String} viber
			 */
			types: {
				email: "fa fa-at",
				phone: "fa fa-phone",
				telegram: "fab fa-telegram-plane",
				viber: "fab fa-viber",
				whatsapp: "fab fa-whatsapp"
			},

			/** @type {Boolean} */
			hasScrollbar: false,

			/** @type {ResizeObserver|undefined} */
			listWatcher: undefined
		}
	},

	computed: {
		/**
		 * Check can i edit my contacts
		 * 
		 * @prop {Function} editable
		 * 
		 * @returns {Boolean}
		 */
		editable() {
			return this.canEdit && this.hash === this.sdk.address;
		},

		form() {
			return this.$refs.form;
		}
	},

	methods: {
		/**
		 * Get icon for field
		 * 
		 * @method getIcon
		 * 
		 * @param {String} type
		 * 
		 * @returns {String}
		 */
		getIcon(type) {
			if (this.types[type]) {
				return this.types[type];
			} else {
				return `fa fa-${ type }`;
			}
		},

		/**
		 * Get empty fields by type
		 * 
		 * @method isFilled
		 * 
		 * @param {String} type
		 * 
		 * @returns {Boolean}
		 */
		isFilled(type) {
			return this.contacts.filter(f => f.type === type && !f.value).length > 0;
		},

		/**
		 * Fill new field
		 * 
		 * @method fill
		 * 
		 * @param {KeyboardEvent} e
		 * @param {Number} i
		 */
		fill(e, i) {
			try {
				this.contacts[i].value = e.target.value;
				console.log(this.$refs.form, this.$refs.form.validate())
			} catch {}
		},

		/**
		 * Add new field
		 * 
		 * @method add
		 * 
		 * @param {String} type
		 */
		add(type) {
			if (this.isFilled(type)) return;

			/** @type {Field} Push new field to array */
			this.contacts.push({ type, value: "" });
		},

		/**
		 * Remove field
		 * 
		 * @method remove
		 */
		remove(i) {
			/** @type {Array<Field>} Remove field from an array */
			this.contacts.splice(i, 1);
		},

		/**
		 * Sort fields by type
		 * 
		 * @method sort
		 */
		sort() {
			/** @type {Array<Field>} Clone an array for compare */
			const clone = [].concat(this.contacts);

			/* Sort cloned array */
			clone.sort((a, b) => {
				if (a.type < b.type){
					return -1;
				}

				if (a.type > b.type){
					return 1;
				}
				
				return 0;
			});

			/* Compare */
			if (JSON.stringify(this.contacts) !== JSON.stringify(clone)) {
				this.contacts = clone;
			}
		},

		submit() {
			console.log(this.form.serialize())
		}
	},

	watch: {
		/**
		 * Watch for contacts changes
		 * 
		 * @prop {Function} contacts
		 */
		contacts() {
			/* Sort on change */
			this.sort();
		}
	},

	async mounted() {
		this.api.getContacts(this.sdk.address)
			.then(r => r.json())
			.then(d => {
				this.contacts = d?.data || [];
			});
	}
}