<template>
	<v-page-header class="safe-deal-header">
		<section class="title">
			<h1>{{ $t('safeDealLabels.label') }}</h1>
		</section>

		<router-link 
			:to="{ name: 'barterItem', params: { id: this.offer.hash } }"
			class="link"
		>{{ offer.caption }}</router-link>

	</v-page-header>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>