import i18n from "@/i18n/index.js";

export default {
	name: "UsefulTipsDialog",

	i18n,

	data() {
		return {
			lightbox: false,
			tips: {},
			scrollTopBtnVisible: false,
		}
	},

	methods: {
		show() {
			this.$nextTick(() => {
				requestAnimationFrame(() => {
					this.lightbox = true;
					this.$emit("onShow", this);
				});
			});
		},

		hide() {
			this.lightbox = false;
			setTimeout(() => {
				this.$emit("onHide", this);
				this.remove();
			}, 300);
		},

		remove() {
			this.$destroy();
			this.$el.parentNode?.removeChild(this.$el);			
		},

		loadTips() {
			/*
			tips = 
			{
				sections: [
					{
						title: string,
						chapters: [
							{
								title: string,
								items: [
									{
										text: string,
									}
								]
							}
						]
					}
				]
			}
			*/
			
			let sections = [];

			let si = 1; // section index
			while (this.$te_all(`usefulTipsLabels.section_${si}_title`)) {
				const chapters = [];
				const section = {
					id: `section_${si}`,
					title: this.$t(`usefulTipsLabels.section_${si}_title`),
					chapters,
				};
				sections.push(section);

				let ci = 1; // chapter index
				while (this.$te_all(`usefulTipsLabels.section_${si}_chapter_${ci}_title`)) {
					const items = [];
					const chapter = {
						id: `section_${si}_chapter_${ci}`,
						title: this.$t(`usefulTipsLabels.section_${si}_chapter_${ci}_title`),
						items,
					};
					chapters.push(chapter);

					let ii = 1; // item index
					while (this.$te_all(`usefulTipsLabels.section_${si}_chapter_${ci}_item_${ii}_text`)) {
						const 
							values = {},
							valuesExist = this.$te_all(`usefulTipsLabels.section_${si}_chapter_${ci}_item_${ii}_values`);

						if (valuesExist) {
							const serialized = this.$t(`usefulTipsLabels.section_${si}_chapter_${ci}_item_${ii}_values`);
							const pairs = serialized.split(",");
							pairs.forEach(pair => {
								let [key, value] = pair.split(":");
								key = key.trim();
								value = value.trim();
								if (key && value && this.$te_all(value)) {
									values[key] = this.$t(value);
								};
							});
						};

						const item = {
							id: `item_${ii}`,
							text: this.$t(`usefulTipsLabels.section_${si}_chapter_${ci}_item_${ii}_text`, values),
						};
						items.push(item);

						ii++;
					};

					ci++;
				};

				si++;
			};

			this.tips = { sections };
		},

		goToLink(id) {
			const rootEl = this.$refs.lightbox?.$el;
			const targetEl = rootEl?.querySelector(`#${id}`);
			targetEl?.scrollIntoView({ behavior: "instant", block: "start" });
		},

		scrollToTop() {
			this.$refs.lightbox?.resetScroll({behavior: "instant"});
		},

		handleScroll(event) {
			const scrollTop = event.target.scrollTop;
			this.scrollTopBtnVisible = (scrollTop > 500);
		}
	},

	mounted() {
		this.loadTips();
	},
}