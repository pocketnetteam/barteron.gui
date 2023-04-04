<template>
	<nav class="main-menu">
		<ul>
			<li v-for="item in items">
					<router-link :to="item.path">{{ item.name }}</router-link>
			</li>
		</ul>
	</nav>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>