<template>
	<v-select
		class="language-switcher"
		vType="light"
		vSize="md"
		:dropdown="localesList"
		ref="locale"
		@selected="(item) => changeLanguage(item)"
	/>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>