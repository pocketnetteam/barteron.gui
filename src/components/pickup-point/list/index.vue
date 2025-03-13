<template>
	<div 
		v-if="list?.length"
		class="pickup-point-carousel"
	>
		<div class="pickup-point-carousel-holder">
			<carousel>
				<slide
					v-for="(item, index) in list"
					:key="index"
				>
					<loader
						type="offer-tile"
						v-if="loaderState"
					/>
					<PickupPointItem
						v-else
						:item="item"
						role="listItem"
						:mode="mode"
						:isSelected="mode === 'input'"
						@unselectItem="unselectItem"
					/>
				</slide>
			</carousel>
		</div>
	</div>

	<div v-else>
		<div 
			class="pickup-point-empty-list"
			:class="holderClass"
			:data-validatedvalue="validatedValue()"
		>
			<div class="pickup-point-empty-list-area">
				{{ $t("deliveryLabels.pickup_points_enabled_placeholder") }}
			</div>
		</div>

		<label class="v-label">
			<i class="fa fa-info-circle"></i>
			{{ $t("deliveryLabels.pickup_points_enabled_hint") }}
		</label>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>