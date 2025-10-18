<template>
	<v-lightbox
		class="select-deal-type-dialog"
		size="sm"
		:visible="lightbox"
		:title="$t('safeDealLabels.select_deal_type')"
		@onHide="hide"
	>
		<div class="row dir-column content">

			<div class="row dir-column safe-deal-holder gap-sm">
				<v-button 
					vType="roshi"
					@click="selectDealType('safeDeal')"
				>
					<i class="fa fa-shield-alt"></i>
					<span>{{ $t('buttonLabels.safe_deal') }}*</span>
				</v-button>

				<div>
					<span>
						<span class="footnote">*{{ $t('safeDealLabels.validator_fee_required') }}. </span>
						<a 
							href="#" 
							class="link" 
							@click.prevent="showSafeDealInfo"
						>
							<u>{{ $t('safeDealLabels.details') }}</u>
						</a>
					</span>
				</div>
			</div>

			<v-button 
				@click="selectDealType('regularDeal')"
			>
				<span>{{ $t('buttonLabels.purchase_directly') }}</span>
			</v-button>

		</div>
	</v-lightbox>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>