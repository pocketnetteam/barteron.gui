<template>
	<v-button
		class="currency-switcher"
		vType="light"
		vSize="md"
		:dropdown="currenciesList"
		@selected="(item) => selectCurrency(item, true)"
	>
		<template #before>
			<span
				class="currency graphem"
				:class="`graphem-${ currency?.value.toLowerCase() }`"
			>{{ currency?.graphem ?? '?' }}</span>
			<span class="amount">{{ converted ? $n(converted) : '...' }}</span>
		</template>
		
		<span class="value"></span>
	</v-button>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>