<template>
	<v-button
		class="language-switcher"
		type="ghost"
		size="xs"
		:dropdown="[
			{ text: 'EN', value: 'en-US', default: true },
			{ text: 'DE', value: 'de-DE' },
			{ text: 'IT', value: 'it-IT' },
			{ text: 'RU', value: 'ru-RU' }
		]"
		@selected="selectLanguage"
	>
		<span class="value"></span>
	</v-button>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>