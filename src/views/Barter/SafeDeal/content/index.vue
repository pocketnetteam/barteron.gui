<template>
	<v-content 
		v-if="address && userHasAccess"
		class="safe-deal-content"
	>
		<strong class="subtitle">
			{{ actionsListTitle }}
		</strong>

		<div v-if="actionsList.length">
			<ul class="actions-list">
				<li 
					v-for="value in actionsList"
					:key="value"
				>
					<span>{{ value }}</span>
				</li>
			</ul>
		</div>

		<div v-if="infoList.length">
			<div 
				class="info-list"
				:class="`${actionsList.length ? 'after-actions' : ''}`"
			>
				<label
					v-for="value in infoList"
					class="v-label info-level"
				>
					<i class="fa fa-info-circle"></i>
					{{ value }}
				</label>
			</div>
		</div>

		<div class="row sep"></div>

		<div v-if="isBuyer && isStatus1">
			<div class="row">
				<v-switch
					class="no-padding confirmation-switch"
					type="checkbox"
					name="buyerCheckStatus1"
					:label="$t('safeDealLabels.status_1_role_buyer_confirmation')"
					:selected="buyerCheckStatus1Enabled ? 'enabled' : ''"
					:value="'enabled'"
					vType="checkbox"
					vSize="md"
					@change="buyerCheckStatus1StateChanged"
				/>
			</div>

			<div class="row dir-column gap-md field-block">
				<p
					:class="{
						'disabled': !(buyerCheckStatus1Enabled),
					}"
				>{{ $t('safeDealLabels.status_1_role_buyer_deal_value_field_text') }}</p>

				<v-input
					:id="['status1BuyerSafeDealValue']"
					:value="[status1BuyerSafeDealValue]"
					ref="status1BuyerSafeDealValue"
					min="0"
					type="number"
					vSize="md"
					:disabled="!(buyerCheckStatus1Enabled)"
					:vEvents="{
						change: changeStatus1BuyerSafeDealValue,
						input: changeStatus1BuyerSafeDealValue
					}"
				/>
			</div>

			<div class="row dir-column gap-md field-block">
				<p
					:class="{
						'disabled': !(buyerCheckStatus1Enabled),
					}"
				>{{ $t('safeDealLabels.status_1_role_buyer_validator_fee_field_text', {percent: validatorFeePercent}) }}</p>

				<v-switch
					type="radio"
					name="status1BuyerValidatorFeeVariant"
					vSize="sm"
					:value="['buyer', 'seller', 'inHalf']"
					:selected="status1BuyerValidatorFeeVariant"
					:label="[
						$t('safeDealLabels.status_1_role_buyer_validator_fee_variant1'),
						$t('safeDealLabels.status_1_role_buyer_validator_fee_variant2'),
						$t('safeDealLabels.status_1_role_buyer_validator_fee_variant3'),
					]"
					:disabled="[
						!(buyerCheckStatus1Enabled),
						!(buyerCheckStatus1Enabled),
						!(buyerCheckStatus1Enabled),
					]"
					@change="changeStatus1BuyerValidatorFeeVariant"
				/>
			</div>

			<div class="row dir-column gap-md field-block">
				<p
					:class="{
						'amount': true,
						'disabled': !(buyerCheckStatus1Enabled),
					}"
				>{{ $t('safeDealLabels.status_1_role_buyer_transfer_amount_field_text', {payment: status1BuyerTransferAmount}) }}</p>

				<v-button
					:disabled="!(buyerCheckStatus1Enabled)"
					@click="transferPaymentToValidator"
				>
					<span>{{ $t('buttonLabels.transfer_payment_to_validator') }}</span>
				</v-button>

				<label
					class="v-label warning-level"
					:class="{
						'transfer': true,
						'disabled': !(buyerCheckStatus1Enabled),
					}"
				>
					<i class="fa fa-exclamation-triangle"></i>
					{{ $t('safeDealLabels.hint_for_payment_transfer') }}
				</label>


			</div>

		</div>

	</v-content>

	<v-content v-else>
		<section>
			<p>{{ $t('safeDealLabels.user_has_no_access') }}</p>
		</section>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>