<template>
	<nav class="main-menu">
		<menu>
			<menuitem
				v-for="(item, name) in items"
				:key="name"
			>
				<router-link :to="item.path">{{ item.name }}</router-link>
			</menuitem>
		</menu>
	</nav>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>