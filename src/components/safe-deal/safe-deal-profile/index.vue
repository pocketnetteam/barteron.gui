<template>
	<div class="safe-deal-profile">

		<strong class="title">{{ $t("safeDealLabels.validator") }}:</strong>

		<div class="row status-holder">
			<div class="col no-offset">
				<span>{{ $t("safeDealLabels.status") }}:</span>
			</div>

			<div class="col">
				<v-select
					ref="status"
					:disabled="!(editing) || isLoading"
					:dropdown="statusDropdownList"
					@selected="selectStatusEvent"
				/>
			</div>
		</div>

		<div class="row fee-holder">
			<div class="col no-offset">
				<span>{{ $t("safeDealLabels.fee") }}:</span>
			</div>

			<div class="col">
				<v-input
					class="fee"
					:id="['fee']"
					:value="[fee]"
					ref="fee"
					min="0"
					max="99"
					type="number"
					vSize="md"
					:disabled="!(editing) || isLoading"
					:vEvents="{
						change: changeFeeEvent,
						input: changeFeeEvent,
					}"
				/>
			</div>
		</div>


		<div class="edit">
			<!-- Edit button -->
			<v-button
				v-if="!(editing)"
				vType="bulma-stroke"
				:disabled="isLoading"
				@click="edit"
			>
				<span>{{ $t("buttonLabels.edit") }}</span>
			</v-button>

			<!-- Cancel and Save buttons -->
			<div
				v-else
				class="buttons-holder"
			>
				<v-button
					vType="chi-chi"
					:disabled="isLoading"
					@click="cancel"
				>
					<span>{{ $t("buttonLabels.cancel") }}</span>
				</v-button>

				<v-button
					:disabled="isLoading"
					@click="save"
				>
					<span>{{ $t("buttonLabels.save") }}</span>
				</v-button>
			</div>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>