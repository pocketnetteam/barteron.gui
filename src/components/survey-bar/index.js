import Survey from "@/components/survey/index.vue";
import Vue from 'vue';

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
	},

	methods: {
		show() {
			const ComponentClass = Vue.extend(Survey);
			const instance = new ComponentClass({
				propsData: {}
			});
			
			instance.$on('onSubmit', vm => {});

			instance.$mount();
			this.lightboxContainer().appendChild(instance.$el);
			this.$nextTick(() => {
				instance.show();
			});
		},
	}
}