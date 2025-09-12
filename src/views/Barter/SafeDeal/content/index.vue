<template>
	<v-content 
		v-if="address && userHasAccess"
		class="safe-deal-content"
	>

		<div v-if="statusesLoading">
			<div>
				<loader 
					type="circular" 
					align="top"
				/>
			</div>
		</div>

		<div v-if="statusesLoadingError">
			<label
				class="v-label error-level"
			>
				<i class="fa fa-info-circle"></i>
				{{ $t("safeDealLabels.status_loading_error_full_message", {error: statusesLoadingError?.message}) }}
			</label>
		</div>

		<template v-if="!(statusesLoading || statusesLoadingError) && sdk.getFromToTransactionsIsAvailable()">
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

			<div 
				v-if="isBuyer && isStatus('1') || isValidator && isStatus('2')"
				class="row sep"
			>
			</div>

			<template v-if="isBuyer && isStatus('1')">
				<div v-if="waitingForPaymentConfirmation">
					<strong class="subtitle">
						{{ $t("safeDealLabels.waiting_for_payment_confirmation") }}
					</strong>
				</div>

				<div v-else>
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
								'amount': true,
								'disabled': !(buyerCheckStatus1Enabled),
							}"
						>{{ $t('safeDealLabels.transfer_amount_field_text', {payment: $n(status1BuyerTransferAmount, 'shortPkoin')}) }}</p>

						<v-button
							:disabled="!(buyerCheckStatus1Enabled) || (status1BuyerTransferAmount === 0)"
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
			</template>

			<template v-if="isValidator && isStatus('2')">
				<div v-if="waitingForPaymentConfirmation">
					<strong class="subtitle">
						{{ $t("safeDealLabels.waiting_for_payment_confirmation") }}
					</strong>
				</div>

				<div v-else>
					<div class="row">
						<v-switch
							class="no-padding confirmation-switch"
							type="checkbox"
							name="validatorCheckStatus2"
							:label="$t('safeDealLabels.status_2_role_validator_confirmation')"
							:selected="validatorCheckStatus2Enabled ? 'enabled' : ''"
							:value="'enabled'"
							vType="checkbox"
							vSize="md"
							@change="validatorCheckStatus2StateChanged"
						/>
					</div>

					<div class="row dir-column gap-md field-block">
						<p
							:class="{
								'disabled': !(validatorCheckStatus2Enabled),
							}"
						>{{ $t('safeDealLabels.status_2_role_validator_deal_result_field_text') }}</p>

						<v-switch
							type="radio"
							name="status2ValidatorDealResultVariant"
							vSize="sm"
							:value="['yes', 'no']"
							:selected="status2ValidatorDealResultVariant"
							:label="[
								$t('safeDealLabels.status_2_role_validator_deal_result_variant1'),
								$t('safeDealLabels.status_2_role_validator_deal_result_variant2'),
							]"
							:disabled="[
								!(validatorCheckStatus2Enabled),
								!(validatorCheckStatus2Enabled),
							]"
							@change="changeStatus2ValidatorDealResultVariant"
						/>
					</div>

					<div 
						v-if="status2ValidatorDealResultVariant === 'yes' && status2ValidatorCalculationList.length"
						class="row dir-column field-block"
					>
						<p
							:class="{
								'disabled': !(validatorCheckStatus2Enabled),
							}"
						>{{ $t('safeDealLabels.calculation') }}</p>

						<ul 
							:class="{
								'calculation-list': true,
								'disabled': !(validatorCheckStatus2Enabled),
							}"
						>
							<li 
								v-for="value in status2ValidatorCalculationList"
								:key="value"
							>
								<span>{{ value }}</span>
							</li>
						</ul>
					</div>

					<div class="row dir-column gap-md field-block">
						<p
							:class="{
								'amount': true,
								'disabled': !(validatorCheckStatus2Enabled),
							}"
						>{{ $t('safeDealLabels.transfer_amount_field_text', {payment: $n(status2ValidatorTransferAmount, 'shortPkoin')}) }}</p>

						<v-button
							:vType="status2ValidatorDealResultVariant === 'no' ? 'dodoria' : 'blue'"
							:disabled="!(validatorCheckStatus2Enabled) || (status2ValidatorTransferAmount === 0)"
							@click="transferPaymentFromValidator"
						>
							<span>{{ 
								status2ValidatorDealResultVariant === 'no' 
								? $t('buttonLabels.return_payment_to_buyer') 
								: $t('buttonLabels.transfer_payment_to_seller') 
								}}</span>
						</v-button>

						<label
							class="v-label warning-level"
							:class="{
								'transfer': true,
								'disabled': !(validatorCheckStatus2Enabled),
							}"
						>
							<i class="fa fa-exclamation-triangle"></i>
							{{ $t('safeDealLabels.hint_for_payment_transfer') }}
						</label>
					</div>
				</div>
			</template>

			<div 
				v-if="isBuyer && isStatus('4a')"
				class="evaluate-purchase"
			>
				<v-button
					@click="evaluatePurchase"
				>
					<span>{{ $t('buttonLabels.evaluate_purchase') }}</span>
				</v-button>
			</div>
		</template>
	</v-content>

	<v-content v-else>
		<section>
			<p>{{ $t('safeDealLabels.user_has_no_access') }}</p>
		</section>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>