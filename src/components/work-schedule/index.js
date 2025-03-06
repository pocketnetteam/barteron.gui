import ThemeStore from "@/stores/theme.js";
import Vue from "vue";

export default {
	name: "WorkSchedule",

	props: {
		workSchedule: {
			type: Object,
			default: () => ({})
		},
		holderClass: String,
	},

	computed: {
		isDarkTheme() {
			return ThemeStore.isDarkTheme();
		},
	},

	data() {
		return {
			weekDays: {},
			additionalInfo: "",
		}
	},

	methods: {
		dayKey(dayNumber) {
			return "day" + dayNumber;
		},

		dayEnabledStateChanged(dayNumber, event) {
			const key = this.dayKey(dayNumber);
			if (event.target.checked) {
				if (!(this.weekDays[key])) {
					Vue.set(this.weekDays, key, {});
				}
			} else {
				Vue.delete(this.weekDays, key);
			}
		},

		startTimeChanged(dayNumber, event) {
			const key = this.dayKey(dayNumber);
			Vue.set(this.weekDays[key], "startTime", event.target.value);
		},

		finishTimeChanged(dayNumber, event) {
			const key = this.dayKey(dayNumber);
			Vue.set(this.weekDays[key], "finishTime", event.target.value);
		},

		allDayEnabledStateChanged(dayNumber, event) {
			const key = this.dayKey(dayNumber);
			if (event.target.checked) {
				Vue.set(this.weekDays[key], "allDay", true);
				Vue.delete(this.weekDays[key], "startTime");
				Vue.delete(this.weekDays[key], "finishTime");
			} else {
				Vue.delete(this.weekDays[key], "allDay");
			}
		},

		getWeekDays(format = "short") {
			const
				result = [],
				locale = this.$root.$i18n.locale,
				baseDate = new Date(Date.UTC(2025, 0, 6)); // just a Monday

			for(i = 0; i < 7; i++) {
				const dayName = baseDate.toLocaleDateString(locale, { weekday: format });
				result.push(this.capitalizeFirstLetter(dayName));
				baseDate.setDate(baseDate.getDate() + 1);       
			}

			return result;
		},

		capitalizeFirstLetter(value) {
			return String(value).charAt(0).toUpperCase() + String(value).slice(1);
		},

		validate() {
			let result = true;

			console.log('this.weekDays', this.weekDays);
			

			let atLeastOneDayFound = false;
			for (let dayNumber = 1; dayNumber <= 7; dayNumber++) {
				const
					key = this.dayKey(dayNumber),
					dayData = this.weekDays[key];
				
				if (dayData) {
					atLeastOneDayFound = true;
					if (!(dayData.allDay || (dayData.startTime && dayData.finishTime))) {
						result = false;
					} else if (dayData.startTime && dayData.finishTime) {
						const [startHH, startMM] = dayData.startTime.split(":");
						const [finishHH, finishMM] = dayData.finishTime.split(":");

						const emptyExists = !(startHH.length && startMM.length && finishHH.length && finishMM.length);
						if (emptyExists) {
							result = false;
						}

						try {
							const
								startInMinutes = Number(startHH) * 60 + Number(startMM),
								finishInMinutes = Number(finishHH) * 60 + Number(finishMM);
							
							if (startInMinutes >= finishInMinutes) {
								result = false;
							}
						} catch (error) {
							result = false;
						}
					}
				}
			}
			
			if (!(atLeastOneDayFound)) {
				result = false;
			}

			return result;
		},

		validatedValue() {
			return this.validate() ? true : null;
		},

		serialize() {
			const data = {
				weekDays: this.weekDays,
				additionalInfo: this.$refs.additionalInfo.content,
			};
			return JSON.parse(JSON.stringify(data));
		},

		fillWorkSchedule() {
			for (let dayNumber = 1; dayNumber <= 7; dayNumber++) {
				const
					key = this.dayKey(dayNumber),
					dayData = this.workSchedule?.weekDays?.[key];
				
				if (dayData) {
					Vue.set(this.weekDays, key, dayData);
				}
			}

			this.additionalInfo = this.workSchedule?.additionalInfo || "";
		}
	},

	mounted() {
		this.fillWorkSchedule();
	}
}