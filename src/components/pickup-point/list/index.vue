<template>
	<div class="pickup-point-carousel">

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
					/>
				</slide>
			</carousel>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>