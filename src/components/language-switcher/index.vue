<template>
	<v-button
		class="language-switcher"
		type="ghost"
		size="xs"
		:dropdown="[
			{ name: 'EN', value: 'en-US' },
			{ name: 'DE', value: 'de-DE' },
			{ name: 'IT', value: 'it-IT' },
			{ name: 'RU', value: 'ru-RU' }
		]"
		dropdownValueKey="name"
		@selected="selectLanguage"
	>
		<span ref="value">EN</span>
	</v-button>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>