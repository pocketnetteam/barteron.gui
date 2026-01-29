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

	inject: ["dialog", "categorySelectDialog", "setCategorySelectProps"],

	data() {
		return {
			parentItem: null,
			carouselCurrentPages: {},
			previewWidth: null,
		};
	},

	computed: {
		subPreviewCategories() {
			return {
				"13587": "all",
				"2": [
					149,
					3,
					40,
					4,
					5,
					257,
					26395,
					7,
					10,
					9,
					494,
					497,
					6,
					507,
					522,
					526,
					527,
				],
				"11450": [
					11451,
					11534,
					11645,
					11682,
					11722,
				],
				"293": "all",
				"7000": "all",
				"888": "all",
				"2000": "all",
				"2984": "all",
				"3000": "all",
				"6000": "all",
				"8000": "all",
				"10542": [
					10543,
					10560,
					10564,
					10567,
				],
				"20": "all",
				"5000": "all",
				"11700": "all",
				"281": "all", 
				"12": "all",
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
				categoryIds = "13587,2,2000,3000,11700,293,7000,11450,2984,888,20,5000,6000,10542,8000,281,12".split(",");
			};

			const result = categoryIds
				.map(m => ({
					id: Number(m),
					type: "category",
				}))
				.map(m => this.previewItem(m));

			const isSubcategory = this.parentItem?.id;

			if (isSubcategory) {
				const backItem = {
					name: "back_to_preview",
					icon: "fa-chevron-left",
					type: "back",
				};

				result.unshift(this.previewItem(backItem));
			};

			const allCategoriesItem = {
				name: "all_categories",
				icon: "fa-bars",
				type: "select",
				parentItemId: this.parentItem?.id,
			};

			result.push(this.previewItem(allCategoriesItem));

			if (isSubcategory) {
				const allOffersItem = {
					name: "all_offers",
					icon: "fa-arrow-alt-circle-right",
					type: "offers",
					parentItemId: this.parentItem?.id,
				};

				result.push(this.previewItem(allOffersItem));
			}

			return result;
		},

		previewItem(rawItem) {
			const 
				isCategory = rawItem.type === "category",
				data = isCategory ? this.categories.findById(rawItem.id) : {},
				key = (data.name || rawItem.name),
				defaultIcon = "fa-folder-open";

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
				slideWidth = 136,
				defaultColumnCount = 9,
				visibleColumnCount = (this.previewWidth ? Math.floor(this.previewWidth / slideWidth) : defaultColumnCount);

			let columnCount = defaultColumnCount;
			if (items.length <= visibleColumnCount) {
				columnCount = items.length;
			} else if (Math.round(items.length / 2) <= visibleColumnCount) {
				columnCount = visibleColumnCount;
			} else {
				columnCount = Math.round(items.length / 2);
			};

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
					this.goToCategory(item.id);
				}
			} else if (item.type === "back") {
				this.setParentItem(null);
			} else if (item.type === "select") {
				this.showCategorySelectDialog(item.parentItemId);
			} else if (item.type === "offers") {
				this.goToCategory(item.parentItemId);
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

		goToCategory(id) {
			this.setCarouselCurrentPage();
			this.categorySelected(id);
		},

		showCategorySelectDialog(parentId) {
			this.setCarouselCurrentPage();
			
			this.setCategorySelectProps({
				value: parentId,
				marked: undefined,
				title: undefined,
				mode: undefined,
				resetScroll: true,
			});

			const showAfterPropsSetting = () => {
				const dialog = this.categorySelectDialog();
				dialog.$once("selected", (id) => {
					this.categorySelected(id);
				});
				dialog.$once("onHide", () => {
					dialog.$off();
					this.setCategorySelectProps(null);
				});
				dialog.show();
			}

			this.$nextTick(showAfterPropsSetting);
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

		updatePreviewWidth() {
			this.previewWidth = this.$refs.carousel?.$el?.clientWidth;
		},
	},

	mounted() {
		this.$2watch("$refs.carousel").then(() => {
			this.updatePreviewWidth();
		});
	},

	updated() {
		this.updatePreviewWidth();
	},

	activated() {
		this.restoreCarouselCurrentPage();
	},
}