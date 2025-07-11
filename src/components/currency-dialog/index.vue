<template>
	<v-lightbox
		class="select-currency-dialog"
		size="md"
		:visible="lightbox"
		:title="$t('select_currency_dialog')"
		@onHide="hide"
	>

		<div class="currencies-holder">
			<v-button
				v-for="item in currencyItems"
				class="currency-item"
				:class="(item.value === selected) ? 'selected' : ''"
				:key="item.value"
				vType="transparent"
				@click="select(item)"
			>{{ item.text }}</v-button>
		</div>

	</v-lightbox>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>