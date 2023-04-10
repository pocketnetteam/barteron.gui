<template>
	<nav class="sub-categories">
		<ul>
			<li
				v-for="(item, index) in items"
				:key="index"
			>
				<router-link :to="{ name: 'category', params: { slug: item.slug } }">
					{{ $t(item.name) }}
				</router-link>
			</li>
		</ul>
	</nav>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>