import { Carousel, Slide } from "@/components/vue-snap/index.js";
import "@/components/vue-snap/vue-snap.css";
import PreviewSlide from "./slide/index.vue";
import Vue from 'vue';

export default {
	name: "CategoriesPreview",

	components: {
		Carousel,
		Slide,
		PreviewSlide,
	},

	inject: ["dialog", "categorySelectDialog", "setCategorySelectProps"],

	data() {
		return {
			parentItem: null,
			carouselCurrentPages: {},
		};
	},

	computed: {
		subPreviewCategories() {
			return {
				"13587": "all",
				"11450": [
					11451,
					11534,
					11645,
					11682,
					11722,
				],
			}
		},
	},

	methods: {
		previewItems() {
			let categoryIds = [];
			const subPreview = this.subPreviewCategories[this.parentItem?.id];
			if (subPreview === "all") {
				categoryIds = this.parentItem.children;
			} else if (subPreview?.length) {
				categoryIds = subPreview
			} else {
				categoryIds = "13587,2,4000,2000,3000,293,619,625,888,2984,6000,8000,10542,11450,20,11700,15032,58058,12".split(",");
			};

			const result = categoryIds
				.map(m => ({
					id: Number(m),
					type: "category",
				}))
				.map(m => this.previewItem(m));

			if (this.parentItem?.id) {
				const backItem = {
					name: "back_to_preview",
					icon: "fa-chevron-left", //"fa-chevron-circle-left", //"fa-chevron-left", //, //"fa-arrow-alt-circle-left", //
					type: "back",
				};

				result.unshift(this.previewItem(backItem));
			};

			const allCategoriesItem = {
				name: "all_categories",
				icon: "fa-bars",
				type: "link",
				parentItemId: this.parentItem?.id,
			};

			result.push(this.previewItem(allCategoriesItem));

			return result;
		},

		previewItem(rawItem) {
			const 
				isCategory = rawItem.type === "category",
				data = isCategory ? this.categories.findById(rawItem.id) : {},
				key = (data.name || rawItem.name),
				defaultIcon = "fa-th-large";

			const result = {
				...data,
				...rawItem,
				key,
			};

			result.icon = result.icon || defaultIcon;

			return result;
		},

		groupedList() {
			let items = this.previewItems();
			const 
				rows = [],
				columnCount = 10; //Math.round(items.length / 2);

			while (items.length) {
				const part = items.splice(0, columnCount);
				rows.push(part);
			};
			const result = [];
			for (let j = 0; j < columnCount; j++) {
				const temp = [];
				for (let i = 0; i < rows.length; i++) {
					const item = rows[i][j];
					item && temp.push(item);
				}
				temp.length && result.push(temp);
			};
			return result;
		},

		selectItem(item) {
			if (item.type === "category") {
				const subPreview = this.subPreviewCategories[item.id];
				if (subPreview) {
					this.setParentItem(item);
				} else {
					this.setCarouselCurrentPage();
					this.$router.push({
						name: "category",
						params: { id: item.id }
					}).catch(e => {
						console.error(e);
						this.showVersionConflictIfNeeded(e);
					});
				}
			} else if (item.type === "back") {
				this.setParentItem(null);
			} else if (item.type === "link") {
				this.showCategorySelectDialog(item.parentItemId);
			};
		},

		setParentItem(item) {
			this.setCarouselCurrentPage();
			this.parentItem = item;
			this.restoreCarouselCurrentPage();
		},

		setCarouselCurrentPage() {
			const parentId = this.parentItem?.id || "main";
			this.carouselCurrentPages[parentId] = this.$refs.carousel.getCurrentPage();
		},

		restoreCarouselCurrentPage() {
			this.$nextTick(() => {
				const 
					parentId = this.parentItem?.id || "main",
					defaultPage = 0,
					targetPage = this.carouselCurrentPages[parentId] || defaultPage;

				this.$refs.carousel.$emit("go-to-page", targetPage, { behavior: "instant" });
			});
		},

		showCategorySelectDialog(parentId) {
			this.setCategorySelectProps({
				value: parentId,
				marked: undefined,
			});
			const dialog = this.categorySelectDialog();
			dialog.$once("selected", (id) => {
				this.categorySelected(id);
			});
			dialog.$once("onHide", () => {
				dialog.$off();
				this.setCategorySelectProps(null);
			});
			dialog.show();
		},

		categorySelected(id) {
			this.$router.push({
				name: "category",
				params: { id }
			}).catch(e => {
				console.error(e);
				this.showVersionConflictIfNeeded(e);
			});
		},
	},

	activated() {
		this.restoreCarouselCurrentPage();
	},
}