<template>
	<v-page-header>
		<v-page-header-title
			:breadcrumbs="false"
			:favorite="false"
			:count="false"
			:title="$t(`pageLabels.${ offer.hash ? 'edit' : 'create' }Barter`)"
		/>
	</v-page-header>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>