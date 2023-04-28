<template>
	<v-content class="shrink">
		<div class="row center">
			<div class="my-barter">
				<router-link :to="{ name: 'barterItem', params: { id: 123 } }">
					<img src="@/assets/images/barter/macbook-2.jpeg" alt="barter-name">
				</router-link>
			</div>
		</div>

		<div class="row dir-column center">
			<strong class="title">{{ $t('exchange_options') }}</strong>
			<p>{{ $t('echange_options_text') }}</p>
		</div>

		<div class="row block">
			<BarterList
				:items="barters.slice(0, 8)"
				vType="row"
			/>
		</div>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>