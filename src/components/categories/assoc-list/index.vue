<template>
	<ul class="categories-assoc-list">
		<li
			v-for="(item, i) in items"
			:key="i"
			:class="{
				'assoc-item': true,
			}"
		>
			<router-link :to="{ name: 'category', params: { slug: item.name } }">
				<span class="text">
					{{ $t(item.name) }}
				</span>
				<picture v-if="item.image">
					<img :src="imageUrl(item.image)" :alt="item.name">
				</picture>
			</router-link>
		</li>
	</ul>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>