<template>
	<div class="work-schedule">
		<div 
			v-if="isEditMode"
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
					:selected="weekDayExists(dayNumber) ? 'enabled' : ''"
					:value="'enabled'"
					:label="[weekDayName(dayNumber)]"
					vType="checkbox"
					vSize="sm"
					@change="(value, event) => dayEnabledStateChanged(dayNumber, event)"
				/>

				<div class="range">
					<v-input
						:class="{
							'field-custom-validation': true,
							'interval-input': true,
							'wrong-field': requiredInputTimeIsEmpty(dayNumber, 'startTime') 
								|| filledIntervalIsWrong(dayNumber),
							'dark-theme': isDarkTheme
						}"
						:disabled="!(weekDayExists(dayNumber)) || allDaySelected(dayNumber)"
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
						'disabled': !(weekDayExists(dayNumber)) || allDaySelected(dayNumber)
					}">-</label>
					
					<v-input
						:class="{
							'field-custom-validation': true,
							'interval-input': true,
							'wrong-field': requiredInputTimeIsEmpty(dayNumber, 'finishTime') 
								|| filledIntervalIsWrong(dayNumber),
							'dark-theme': isDarkTheme
						}"
						:disabled="!(weekDayExists(dayNumber)) || allDaySelected(dayNumber)"
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
					:selected="allDaySelected(dayNumber) ? 'enabled' : ''"
					:value="'enabled'"
					:label="[$t('deliveryLabels.all_day')]"
					:disabled="!(weekDayExists(dayNumber))"
					vType="checkbox"
					vSize="sm"
					@change="(value, event) => allDayEnabledStateChanged(dayNumber, event)"
				/>

			</div>
		</div>

		<div 
			v-if="isEditMode"
			id="additional-info-holder"
		>
			<v-textarea
				ref="additionalInfo"
				class="field-custom-validation"
				name="workScheduleAdditionalInfo"
				length="250"
				:placeholder="$t('deliveryLabels.work_schedule_additional_info_placeholder')"
				:value="additionalInfo"
			/>
		</div>
		
		<div v-if="isViewMode" class="row block">
			<div>
				<p 
					v-for="(row, index) in weekDaysListForView()"
					:key="index"
					class="description"
				><span class="work-schedule-day-name">{{ row.weekDayName }}</span> {{ row.timeInterval }}</p>
			</div>

			<div 
				v-if="additionalInfo"
				class="work-schedule-additional-info"
			>
				<label>
					<i class="fa fa-info-circle"></i>
					{{ additionalInfo }}
				</label>
			</div>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>