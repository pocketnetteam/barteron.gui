<template>
	<div
		:class="{
			'barter-carousel': carousel,
			[`barter-list-${ vType }`]: !carousel
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
					<BarterItem :item="item" :vType="vType">
						<template #favorite v-if="$slots.favorite || $scopedSlots.favorite">
							<slot name="favorite" :item="item"></slot>
						</template>

						<template #info v-if="$slots.info || $scopedSlots.info">
							<slot name="info" :item="item"></slot>
						</template>

						<template #offer v-if="$slots.offer || $scopedSlots.offer">
							<slot name="offer" :item="item"></slot>
						</template>
					</BarterItem>
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

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>