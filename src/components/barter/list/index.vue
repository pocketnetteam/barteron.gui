<template>
	<div
		:class="{
			'barter-carousel': carousel,
			[`barter-list-${ vType }`]: !carousel
		}"
	>
		<div
			class="barter-list-holder"
			v-if="!carousel"
		>
			<ul
				class="barter-track"
				ref="track"
			>
				<li
					v-for="(item, index) in list"
					:key="index"
				>
					<loader
						type="offer-tile"
						v-if="loaderState"
					/>
					<BarterItem
						v-else
						:item="item"
						:vType="vType"
						:customLink="customLink"
					>
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
			class="barter-carousel-holder"
			v-else
		>
			<carousel>
				<slide
					v-for="(item, index) in list"
					:key="index"
				>
					<loader
						type="offer-tile"
						v-if="loaderState"
					/>
					<BarterItem
						v-else
						:item="item"
						:vType="vType"
						:customLink="customLink"
					>
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
				</slide>
				<slide 
					v-if="showForwardButton"
					class="forward-button"
				>
					<v-button 
						@click="forwardButtonClick"
					>
						<i class="fa fa-forward"></i>
					</v-button>
				</slide>
			</carousel>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>