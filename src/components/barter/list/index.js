import BarterItem from "../item/index.vue";

export default {
	name: "BarterList",

	components: {
		BarterItem
	},

	props: {
		items: {
			type: Array,
			default: () => []
		},
		carousel: Boolean
	},

	data() {
		return {
			slide: 0,
			prevDisabled: true,
			nextDisabled: false
		}
	},

	computed: {
		/**
		 * Calc item width + grid gap
		 * 
		 * @return {Number}
		 */
		itemDimensions() {
			const
				slide = this.$refs.track.children[0],
				gap = parseFloat(getComputedStyle(this.$refs.track).gap);

			return {
				width: slide.offsetWidth,
				gap: gap,
				all: slide.offsetWidth + gap
			};
		},

		/**
		 * Calc items count in visible area
		 * 
		 * @returns {Number}
		 */
		itemsVisible() {
			return Array.from(this.$refs.track.children).filter(item => {
				const
					holder = this.$refs.holder.getBoundingClientRect(),
					cell = item.getBoundingClientRect(),
					dim = this.itemDimensions.all;

				return cell.left >= (holder.left - dim) && cell.right <= (holder.right + dim);
			}).length;
		}
	},

	methods: {
		prepare() {
			this.prevDisabled = !(this.slide > 0);
			this.nextDisabled = !(this.slide < this.items.length - this.itemsVisible);

			return {
				prevDisabled: this.prevDisabled,
				nextDisabled: this.nextDisabled
			}
		},

		animate() {
			let offset;

			if (!this.prepare().nextDisabled) {
				/* Shift to one item */
				offset = this.itemDimensions.all * this.slide;
			} else {
				/* Shift to end of slider */
				const
					holder = this.$refs.holder.getBoundingClientRect(),
					last = this.$refs.track.children[this.items.length - 1].getBoundingClientRect(),
					dim = this.itemDimensions,
					pos = last.right - dim.width + dim.gap;
				
				offset = pos > holder.right ? pos : this.itemDimensions.all * this.slide
			}

			this.$refs.track.style.transform = `translateX(-${ offset }px)`;
		},

		prev() {
			if (!this.prepare().prevDisabled) {
				this.slide--;
				this.animate();
			}
		},

		next() {
			if (!this.prepare().nextDisabled) {
				this.slide++;
				this.animate();
			}
		}
	}
}