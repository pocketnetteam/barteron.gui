<template>
	<div
		:class="{
			'barter-item': true
		}"
	>
		<span class="state">{{ item.used ? 'I/U' : 'New' }}</span>

		<picture v-if="item.image">
			<img :src="imageUrl(item.image)" :alt="item.title">
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

		<div class="row title" v-if="item.title">
			<span>{{ item.title }}</span>
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