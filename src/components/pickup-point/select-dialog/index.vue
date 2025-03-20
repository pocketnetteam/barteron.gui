<template>
	<v-lightbox
		class="pickup-point-dialog"
		size="md"
		:visible="lightbox"
		:title="item?.isSelfPickup ? $t('deliveryLabels.self_pickup_additional_info') : $t('deliveryLabels.pickup_point')"
		@onHide="hide"
	>

		<p class="additional-info" v-if="item?.isSelfPickup">{{ item?.additionalInfo || $t('deliveryLabels.no_self_pickup_additional_info') }}</p>

		<BarterItem
			v-else
			:item="item"
			vType="page"
		/>

		<!-- Footer -->
		<template #footer>
			<div class="row full-width right">
				<div class="buttons-holder min-h-w">
					<template v-if="mode !== 'readonly'">
						<v-button
							v-if="isSelected"
							vType="hit"
							@click="dialogAction"
						>
							<span>{{ $t('buttonLabels.cancel') }}</span>
						</v-button>
						<v-button
							v-else
							vType="hit"
							@click="dialogAction"
						>
							<span>{{ $t('buttonLabels.select') }}</span>
						</v-button>
					</template>
					<v-button
						@click="hide"
					>
						<span>{{ $t('buttonLabels.close') }}</span>
					</v-button>
				</div>
			</div>
		</template>
	</v-lightbox>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>