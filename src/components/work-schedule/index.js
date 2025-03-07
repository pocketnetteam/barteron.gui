import ThemeStore from "@/stores/theme.js";
import Vue from "vue";

export default {
	name: "WorkSchedule",

	props: {
		workSchedule: {
			type: Object,
			default: () => ({})
		},
		mode: String,
		holderClass: String,
	},

	data() {
		return {
			weekDays: {},
			additionalInfo: "",
		}
	},

	computed: {
		isEditMode() {
			return (this.mode === "edit");
		},

		isViewMode() {
			return (this.mode === "view");
		},

		isDarkTheme() {
			return ThemeStore.isDarkTheme();
		},

		getWeekDays() {
			const
				result = [],
				locale = this.$root.$i18n.locale,
				baseDate = new Date(Date.UTC(2025, 0, 6)); // just a Monday

			for(i = 0; i < 7; i++) {
				const dayName = baseDate.toLocaleDateString(locale, { weekday: "short" });
				result.push(this.capitalizeFirstLetter(dayName));
				baseDate.setDate(baseDate.getDate() + 1);       
			}

			return result;
		},
	},

	methods: {
		dayKey(dayNumber) {
			return "day" + dayNumber;
		},

		weekDayName(dayNumber) {
			return this.getWeekDays[dayNumber - 1];
		},

		weekDayExists(dayNumber) {
			return this.weekDays[this.dayKey(dayNumber)];
		},

		allDaySelected(dayNumber) {
			return this.weekDays[this.dayKey(dayNumber)]?.allDay;
		},

		requiredInputTimeIsEmpty(dayNumber, prop) {
			return this.weekDayExists(dayNumber) && !(this.allDaySelected(dayNumber)) && !(this.intervalTimeFilled(dayNumber, prop));
		},

		intervalTimeFilled(dayNumber, prop) {
			const dayData = this.weekDays[this.dayKey(dayNumber)];
			const [hh, mm] = (dayData?.[prop] || "").split(":");
			return (hh?.length && mm?.length);
		},

		filledIntervalIsWrong(dayNumber) {
			let result = false;

			const dayData = this.weekDays[this.dayKey(dayNumber)];
			if (dayData?.startTime && dayData?.finishTime) {
				const emptyExists = !(this.intervalTimeFilled(dayNumber, "startTime") && this.intervalTimeFilled(dayNumber, "finishTime"));
				if (emptyExists) {
					result = true;
				} else {
					const [startHH, startMM] = dayData.startTime.split(":");
					const [finishHH, finishMM] = dayData.finishTime.split(":");
	
					try {
						const
							startInMinutes = Number(startHH) * 60 + Number(startMM),
							finishInMinutes = Number(finishHH) * 60 + Number(finishMM);
						
						if (startInMinutes >= finishInMinutes) {
							result = true;
						}
					} catch (error) {
						result = true;
					}
				}
			}
			
			return result;
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

		capitalizeFirstLetter(value) {
			return String(value).charAt(0).toUpperCase() + String(value).slice(1);
		},

		validate() {
			let result = true;

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
						if (this.filledIntervalIsWrong(dayNumber)) {
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

		weekDaysListForView() {
			const result = [];
			for (let dayNumber = 1; dayNumber <= 7; dayNumber++) {
				const
					key = this.dayKey(dayNumber),
					dayData = this.weekDays[key];
				
				if (dayData) {
					const 
						weekDayName = `${this.weekDayName(dayNumber)}:`,
						timeInterval = dayData.allDay 
							? this.$t("deliveryLabels.around_the_clock") 
							: `${dayData.startTime} - ${dayData.finishTime}`,
						row = {
							weekDayName, 
							timeInterval
						};

					result.push(row);
				}
			}
			return result;
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