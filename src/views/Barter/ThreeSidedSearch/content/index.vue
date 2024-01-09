<template>
	<v-content>
		<ul
			class="group-exchange-holder"
			v-if="deals.length"
		>
			<li
				class="row"
				v-for="(deal, index) in deals"
				:key="index"
			>
				<div class="col">
					<ul class="offers">
						<Offer :deal="deal.source" />
						<Offer :deal="deal" />
						<Offer :deal="deal.target" />
					</ul>
				</div>
				<div class="col">
					<v-button @click="createRoom(deal)">{{ $t('buttonLabels.offer_an_exchange') }}</v-button>
				</div>
			</li>
		</ul>

		<p v-else>{{ $t('exchangeLabels.empty') }}</p>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>