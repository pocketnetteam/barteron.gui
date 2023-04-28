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
		carousel: Boolean,
		vType: {
			type: String,
			default: "tile"
		}
	},

	data() {
		return {
			index: 0,
			indexPos: 0,
			prevDisabled: true,
			nextDisabled: false
		}
	},

	computed: {
		/**
		 * Get grid gap in px
		 * 
		 * @returns {Number}
		 */
		gridGap() {
			return parseFloat(getComputedStyle(this.$refs.track).gap);
		},

		/**
		 * Get slides
		 * 
		 * @returns {Array}
		 */
		slides() {
			return [...this.$refs.track.children];
		}
	},

	methods: {
		/**
		 * Animate carousel
		 * 
		 * @param {Boolean} next - Direction
		 */
		animate(next) {
			const
				/* Get count of visible slides */
				visible = parseInt(this.$refs.holder.offsetWidth / this.slides[0].offsetWidth),

				/* Calc item offset at right */
				offset = (() => {
					const slide = this.slides[0 + visible];
					return (slide.offsetLeft + slide.offsetWidth) - this.$refs.holder.offsetWidth;
				})(),

				/* Next track offset by index */
				nextPos = this.index * (this.slides[0].offsetWidth + this.gridGap);

			/* Enable/Disable controls */
			this.prevDisabled = this.index < 1;
			this.nextDisabled = this.index >= this.items.length - visible;

			if (!next) {
				/* Logic for prev action */
				this.indexPos = nextPos;
			} else {
				/* Logic for next action */
				const maxPos = (this.items.length - visible - 1) * (this.slides[0].offsetWidth + this.gridGap) + offset;

				this.indexPos = nextPos <= maxPos ? nextPos : maxPos;
				if (nextPos >= maxPos) this.index = this.items.length - visible;
			}

			/* Shift track */
			this.$refs.track.style.transform = `translateX(-${ this.indexPos }px)`;
		},

		/**
		 * Prev button handler
		 */
		prev() {
			if (this.index > 0) this.index--;
			this.animate(false);
		},

		/**
		 * Next button handler
		 */
		next() {
			if (this.index < this.items.length - 1) this.index++;
			this.animate(true);
		}
	}
}