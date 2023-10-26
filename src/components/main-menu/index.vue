<template>
	<nav class="main-menu">
		<menu v-if="items.length">
			<menuitem
				v-for="(item, index) in items"
				:key="index"
			>
				<router-link :to="item.to">{{ $t(item.name) }}</router-link>
			</menuitem>
		</menu>
	</nav>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>