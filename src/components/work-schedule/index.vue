<template>
	<div class="work-schedule">
		<div 
			id="work-schedule-day-list" 
			:class="holderClass"
			:data-validatedvalue="validatedValue()"
		>
			<div 
				v-for="dayNumber in 7"
				:key="dayNumber"
				class="day"
			>
				<v-switch
					class="no-padding day-checkbox field-custom-validation"
					type="checkbox"
					name="workScheduleDayEnabledState"
					:selected="weekDays[dayKey(dayNumber)] ? 'enabled' : ''"
					:value="'enabled'"
					:label="[getWeekDays()[dayNumber - 1]]"
					vType="checkbox"
					vSize="sm"
					@change="(value, event) => dayEnabledStateChanged(dayNumber, event)"
				/>

				<div class="range">
					<v-input
						:class="{
							'field-custom-validation': true,
							'interval-input': true,
							'dark-theme': isDarkTheme
						}"
						:disabled="!(weekDays[dayKey(dayNumber)]) || weekDays[dayKey(dayNumber)]?.allDay"
						type="time"
						step="300"
						name="workScheduleDayStartTime"
						vSize="xs"
						:value="weekDays[dayKey(dayNumber)]?.startTime"
						:vEvents="{
							change: (event) => startTimeChanged(dayNumber, event),
							input: (event) => startTimeChanged(dayNumber, event),
						}"
					/>
					
					<label :class="{
						'separator': true,
						'disabled': !(weekDays[dayKey(dayNumber)]) || weekDays[dayKey(dayNumber)]?.allDay
					}">-</label>
					
					<v-input
						:class="{
							'field-custom-validation': true,
							'interval-input': true,
							'dark-theme': isDarkTheme
						}"
						:disabled="!(weekDays[dayKey(dayNumber)]) || weekDays[dayKey(dayNumber)]?.allDay"
						type="time"
						step="300"
						name="workScheduleDayFinishTime"
						vSize="xs"
						:value="weekDays[dayKey(dayNumber)]?.finishTime"
						:vEvents="{
							change: (event) => finishTimeChanged(dayNumber, event),
							input: (event) => finishTimeChanged(dayNumber, event),
						}"
					/>
				</div>

				<v-switch
					class="no-padding field-custom-validation"
					type="checkbox"
					name="workScheduleAllDayEnabledState"
					:selected="weekDays[dayKey(dayNumber)]?.allDay ? 'enabled' : ''"
					:value="'enabled'"
					:label="[$t('deliveryLabels.all_day')]"
					:disabled="!(weekDays[dayKey(dayNumber)])"
					vType="checkbox"
					vSize="sm"
					@change="(value, event) => allDayEnabledStateChanged(dayNumber, event)"
				/>

			</div>
		</div>

		<div id="additional-info-holder">
			<v-textarea
				ref="additionalInfo"
				class="field-custom-validation"
				name="workScheduleAdditionalInfo"
				length="250"
				:placeholder="$t('deliveryLabels.work_schedule_additional_info_placeholder')"
				:value="additionalInfo"
			/>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>