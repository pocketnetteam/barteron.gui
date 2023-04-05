<template>
	<ul class="categories-assoc-list">
		<li
			v-for="(item, i) in items"
			:key="item.id"
			:class="{
				'assoc-item': true,
			}"
		>
			<span class="text">
				{{ item.name }}
			</span>
			<picture v-if="item.image">
				<img :src="imageUrl(item.image)" :alt="item.name">
			</picture>
		</li>
	</ul>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>