<template>
	<v-select
		class="theme-switcher"
		vType="light"
		vSize="md"
		:dropdown="dropdownList"
		ref="theme"
		@selected="changeTheme"
	>
		<span 
			class="value" 
			v-html="htmlContent()"
		></span>
	</v-select>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>