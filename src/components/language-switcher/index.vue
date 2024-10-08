<template>
	<v-button
		class="language-switcher"
		vType="light"
		vSize="md"
		:dropdown="localesList"
		ref="locale"
		@selected="(item) => changeLanguage(item)"
	>
		<span class="value"></span>
	</v-button>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>