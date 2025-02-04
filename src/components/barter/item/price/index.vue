<template>
	<span class="price row">
		<template v-if="item?.price">
			<span id="pkoin-price" class="col">
				<span class="currency icon-pkoin"></span>
				<span class="amount">{{ pkoinPrice ? $n(pkoinPrice) : '...' }}</span>
				<span>{{ $t('profileLabels.coins') }}</span>
			</span>
			<span class="col">
				<CurrencySwitcher
					:amount="item?.price"
					:currencyPrice="item?.currencyPrice"
					:hideButton="true"
				/>
			</span>
		</template>
		<template v-else>
			<span class="currency fa fa-gift"></span>
			<span class="amount">{{ $t('barterLabels.free') }}</span>
		</template>
	</span>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>