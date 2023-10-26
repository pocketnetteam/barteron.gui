<template>
	<div class="overlay" v-if="loading">
		<div class="loader">
			<div class="straight"></div>
			<div class="curve"></div>
			<div class="center"></div>
			<div class="inner"></div>
		</div>
	</div>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>