<template>
	<v-select
		class="theme-switcher"
		vType="light"
		vSize="md"
		:dropdown="themesList.map(theme => ({
			...theme,
			text: `
			<i class='fa ${ theme.icon }'></i>
			${ $t(`themeLabels.${ theme.value }`) }
			`
		}))"
		ref="theme"
		@selected="changeTheme"
	/>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>