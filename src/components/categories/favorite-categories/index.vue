<template>
	<nav class="favorite-categories">
		<ul>
			<li
				v-for="(item, index) in items"
				:key="index"
			>
				<router-link :to="{ name: 'category', params: { id: item.id } }">
					{{ $t(item.name) }}
				</router-link>
			</li>
		</ul>
	</nav>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>