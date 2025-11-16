<template>
	<v-page-header :key="offer?.hash">
		<v-page-header-title :breadcrumbs="offer?.tag" :lastActive="true" />
	</v-page-header>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>