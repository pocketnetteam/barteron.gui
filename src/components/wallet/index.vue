<template>
	<div class="wallet">
		<dl class="list">
			<dt><i class="fa fa-wallet"></i></dt>
			<dd>
				<strong>{{ (balance?.actual || 0).toFixed(2) }}</strong>
				<span>{{ $t('profile.coins') }}</span>
			</dd>
		</dl>

		<v-button>{{ $t('profile.wallet') }}</v-button>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>