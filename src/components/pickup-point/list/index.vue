<template>
	<div 
		v-if="loaderState && loaderItems || items?.length"
		class="pickup-point-carousel"
	>
		<div class="pickup-point-carousel-holder">
			<carousel>
				<slide
					v-for="(item, index) in (loaderState && loaderItems || items)"
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
				{{ emptyListPlaceholder }}
			</div>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>