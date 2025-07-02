<template>
	<div class="wallet">
		<dl class="list">
			<dt><i class="fa fa-wallet"></i></dt>
			<dd>
				<strong>{{ $n((balance?.actual || 0).toFixed(2)) }}</strong>
				<span>{{ $t('profileLabels.coins') }}</span>
			</dd>
		</dl>

		<!-- <v-button>{{ $t('profileLabels.wallet') }}</v-button> -->

		<div class="referral-program">
			<v-button
				@click="showReferralProgramInfo"
			>{{ $t('buttonLabels.referral_program') }}</v-button>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>