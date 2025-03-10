<template>
	<v-lightbox
		class="pickup-point-dialog"
		size="md"
		:visible="lightbox"
		:title="$t('deliveryLabels.pickup_point')"
		@onHide="hide"
	>

		<BarterItem
			:item="item"
			vType="page"
		/>

		<!-- Footer -->
		<template #footer>
			<div class="row full-width right">
				<div class="buttons-holder min-h-w">
					<v-button
						@click="select"
					>
						<span>{{ $t('buttonLabels.select') }}</span>
					</v-button>
				</div>
			</div>
		</template>
	</v-lightbox>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>