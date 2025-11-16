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
				<li v-for="item in list">
					<loader
						type="offer-tile"
						v-if="loaderState"
					/>
					<BarterItem
						v-else
						:key="`${keyPrefix}_${item?.hash}`"
						:item="item"
						:vType="vType"
						:hideInfo="hideInfo"
						:compactView="compactView"
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
			:class="{
				'barter-carousel-holder': true,
				'compact-view': compactView,
			}"
			v-else
		>
			<carousel>
				<slide v-for="item in list">
					<loader
						type="offer-tile"
						v-if="loaderState"
					/>
					<BarterItem
						v-else
						:key="`${keyPrefix}_${item?.hash}`"
						:item="item"
						:vType="vType"
						:hideInfo="hideInfo"
						:compactView="compactView"
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
			</carousel>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>