import { Carousel, Slide } from "@/components/vue-snap/index.js";
import "@/components/vue-snap/vue-snap.css";
import PreviewSlide from "./slide/index.vue";

export default {
	name: "CategoriesPreview",

	components: {
		Carousel,
		Slide,
		PreviewSlide,
	},

	computed: {
		maxRowNumber() {
			return 10;
		}
	},

	methods: {
		previewItems() {
			const rawItems = "13587,2,4000,2000,3000,293,619,625,888,2984,6000,8000,10542,11450,20,11700,15032,58058,12"
				.split(",")
				.map(m => ({
					id: Number(m),
					type: "category",
				}));
			
			return rawItems.map(m => this.previewItem(m));
		},

		previewItem(rawItem) {
			const 
				data = this.categories.findById(rawItem.id),
				key = (rawItem.type === "category" ? rawItem.id : rawItem.type);

			return {
				...data,
				...rawItem,
				key,
			}
		},

		groupedList() {
			let items = this.previewItems();
			const rows = [];
			while (items.length) {
				const part = items.splice(0, this.maxRowNumber);
				rows.push(part);
			};
			const result = [];
			for (let j = 0; j < this.maxRowNumber; j++) {
				const temp = [];
				for (let i = 0; i < rows.length; i++) {
					const item = rows[i][j];
					item && temp.push(item);
				}
				result.push(temp);
			};
			return result;
		},

	}
}