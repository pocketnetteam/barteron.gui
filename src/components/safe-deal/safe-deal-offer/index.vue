<template>
	<div class="safe-deal">
		<div v-if="isEditMode">
			<div class="row">
				<span class="how-it-works">
					<a 
						href="#" 
						class="link" 
						@click.prevent="showSafeDealInfo"
					>
						<i class="fa fa-info-circle"></i>
						{{ $t('safeDealLabels.how_it_works') }}
					</a>
				</span>
			</div>

			<template v-if="pkoinExchangeSelected">
				<v-switch
					class="no-padding"
					type="checkbox"
					name="validatorFeeVariantsEnabled"
					:label="$t('safeDealLabels.add_validator_fee_payment_options')"
					:selected="validatorFeeVariantsEnabled ? 'enabled' : ''"
					:value="'enabled'"
					vType="checkbox"
					vSize="xl"
					@change="validatorFeeVariantsEnabledStateChanged"
				/>

				<div 
					v-if="validatorFeeVariantsEnabled"
					id="safe-deal"
					class="validator-fee-variants-box"
					:class="holderClass"
					:data-validatedvalue="validatedValue()"
				>
					<div class="validator-fee-variants-title">
						<span>{{ $t('safeDealLabels.ready_to_pay_validator_fee') }}</span>
					</div>

					<div class="validator-fee-variants-holder">
						<v-switch
							type="radio"
							name="validatorFeeVariant"
							vSize="xl"
							:value="validatorFeeVariants"
							:selected="validatorFeeVariant"
							:label="[
								$t('safeDealLabels.offer_validator_fee_variant_seller'),
								$t('safeDealLabels.offer_validator_fee_variant_in_half'),
							]"
							@change="changeValidatorFeeVariant"
						/>
					</div>
				</div>
			</template>

			<template v-else>
				<label class="v-label warning-level">
					<i class="fa fa-exclamation-triangle"></i>
					{{ $t("safeDealLabels.need_select_pkoin_to_enable_safe_deal", {pkoinCategory: $t("pkoin")}) }}
					<a 
						href="#" 
						class="link warning-level" 
						@click.prevent="scrollToGetSection"
					>
						<u>"{{ $t("stepsLabels.get") }}"</u>
					</a>

					<!-- {{ $t("notificationSettingsLabels.telegram_bot_disconnected") }} -->
				</label>
			</template>
		</div>
		
		<div v-else>
			<p class="description">{{ variantDescription }}</p>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>