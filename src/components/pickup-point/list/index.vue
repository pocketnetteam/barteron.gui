<template>
	<div 
		v-if="loaderState && loaderItems || items?.length"
		class="pickup-point-carousel"
	>
		<div class="pickup-point-carousel-holder">
			<carousel ref="carousel">
				<slide
					v-for="(item, index) in (loaderState && loaderItems || items)"
					:key="index"
					:id="getElementId(item?.hash || 'loader')"
					:class="{
						'compact-view': compactView,
					}"
				>
					<loader
						type="offer-tile"
						v-if="loaderState"
					/>
					<PickupPointItem
						v-else
						:ref="item?.hash"
						:item="item"
						role="listItem"
						:mode="mode"
						:isSelected="isSelectedItem(item)"
						@selectItem="selectItem"
						@unselectItem="unselectItem"
						@buyAtItem="buyAtItem"
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
				<p :class="{ 'error': loadingError }">{{ emptyListPlaceholder }}</p>
				<v-button
					v-if="loadingError"
					@click="repeatLoading"
				>{{ $t('buttonLabels.repeat') }}</v-button>
			</div>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>