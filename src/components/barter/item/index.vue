<template>
	<div :class="{ 'barter-item': true }">
		<picture v-if="item.image">
			<span class="state">{{ item.used ? 'I/U' : 'New' }}</span>
			
			<img
				v-if="!Array.isArray(item.image)"
				:src="imageUrl(item.image)"
				:alt="item.title"
			>
			<template v-else>
				<ul class="slide">
					<li
						v-for="(image, index) in item.image"
						:key="index"
						:class="{ 'hover': hover === index }"
						@mouseenter="hoverize(index)"
						@mouseleave="hoverize(0)"
					>
						<img
							:src="imageUrl(image)"
							:alt="`${ item.title }#${ index+1 }`"
						>
					</li>
				</ul>
				<ul
					class="bullets"
					v-if="item.image.length > 1"
				>
					<li
						v-for="(image, index) in item.image"
						:key="index"
						:class="{ 'hover': hover === index }"
						@mouseenter="hoverize(index)"
						@mouseleave="hoverize(0)"
					>{{ index }}</li>
				</ul>
			</template>
		</picture>

		<div class="row pricing" v-if="item.price">
			<span class="price">
				<span class="currency pkoin"></span>
				{{ formatCurrency({ value: item.price }) }}
			</span>
			<span class="favorite">
				<i class="fa fa-heart"></i>
			</span>
		</div>

		<div class="row title" v-if="item.name">
			<span>{{ decodeString(item.name) }}</span>
		</div>

		<div class="row to" v-if="item.to">
			<span>{{ `Exchange to: ${ getCategories(item.to) }` }}</span>
		</div>

		<div class="row info" v-if="item.published || item.location">
			<ul>
				<li v-if="item.published">{{ item.published }}</li>
				<li v-if="item.location">{{ calcDistance(item.location) }}</li>
			</ul>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>