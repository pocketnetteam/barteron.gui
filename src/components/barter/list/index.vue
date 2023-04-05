<template>
	<div
		:class="{
			'barter-carousel': carousel,
			'barter-list': !carousel
		}"
	>
		<div
			:class="{ [`barter-${ carousel ? 'carousel' : 'list' }-holder`]: true }"
			ref="holder"
		>
			<ul
				class="barter-track"
				ref="track"
			>
				<li
					v-for="(item, index) in items"
					:key="index"
				>
					<BarterItem :item="item" />
				</li>
			</ul>
		</div>

		<div
			class="barter-carousel-controls"
			v-if="carousel"
		>
			<div
				:class="{
					'barter-carousel-prev': true,
					'prev-disabled': prevDisabled
				}"
				@click="prev"
			>
				<i class="fa fa-angle-left"></i>
			</div>
			<div
				:class="{
					'barter-carousel-next': true,
					'next-disabled': nextDisabled
				}"
				@click="next"
			>
				<i class="fa fa-angle-right"></i>
			</div>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>