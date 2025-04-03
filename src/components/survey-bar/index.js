import Survey from "@/components/survey/index.vue";
import Vue from 'vue';
import { mapWritableState } from "pinia";
import { useSurveyStore } from "@/stores/survey.js";

export default {
	name: "SurveyBar",

	components: {
		Survey,
	},

	data() {
		return {
		}
	},

	inject: ['lightboxContainer'],

	computed: {
		...mapWritableState(useSurveyStore, ["isSurveyBarVisible"]),
	},

	methods: {
		show() {
			const ComponentClass = Vue.extend(Survey);
			const instance = new ComponentClass({
				propsData: {},
			});
			
			instance.$on('onSubmit', vm => {
				this.close(true);
			});

			instance.$mount();
			this.lightboxContainer().appendChild(instance.$el);
			this.$nextTick(() => {
				instance.show();
			});
		},

		closeEvent() {
			this.close(false);
		},

		close(submitted) {
			this.isSurveyBarVisible = false;
			if (!(submitted)) {
				const data = {
					address: this.sdk.address,
					status: "rejected",
				};
				this.sdk.setSurveyData(data).catch(e => {
					console.error(e);
				});
			}
		}
	}
}