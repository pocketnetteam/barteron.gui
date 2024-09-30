<template>
	<v-button
		class="currency-switcher"
		vType="light"
		:vSize="vSize"
		:dropdown="currenciesList"
		:hideButton="hideButton"
		@selected="(item) => selectCurrency(item, true)"
	>
		<template
			#before
			v-if="amount"
		>
			<span
				class="currency graphem"
				:class="`graphem-${ currency?.value.toLowerCase() }`"
			>{{ currency?.graphem ?? '?' }}</span>
			<span class="amount">{{ converted ? $n(converted) : '...' }}</span>
			<span v-if="hideButton">{{ currency?.value }}</span>
		</template>
		
		<span class="value">{{ currency?.text }}</span>
	</v-button>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>