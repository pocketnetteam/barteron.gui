<template>
	<nav class="sub-categories-list">
		<menu>
			<menuitem
				v-for="(item, index) in items"
				:key="index"
			>
				<router-link :to="{ name: 'category', params: { slug: item.name } }">
					{{ $t(item.name) }}
				</router-link>
			</menuitem>
		</menu>
	</nav>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>