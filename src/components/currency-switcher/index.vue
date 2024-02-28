<template>
	<v-button
		class="currency-switcher"
		vType="light"
		vSize="md"
		:dropdown="currenciesList"
		@selected="(item) => selectCurrency(item, true)"
	>
		<template #before>
			<span class="amount">({{ converted ?? '...' }})</span>
		</template>
		
		<span class="value"></span>
	</v-button>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>