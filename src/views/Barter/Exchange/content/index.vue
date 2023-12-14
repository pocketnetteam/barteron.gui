<template>
	<v-content class="shrink">
		<div class="my-barter-holder">
			<div class="row center">
				<div :class="{
					'my-barter': true,
					'small': expanded
				}">
					<router-link :to="{ name: 'barterItem', params: { id: offer.hash } }">
						<img :src="offer.images[0]" :alt="offer.caption">
					</router-link>
				</div>
			</div>

			<div class="row dir-column center">
				<template v-if="!expanded">
					<strong class="title">{{ $t('exchangeLabels.title') }}</strong>
				</template>
				<template v-else>
					<strong class="title">{{ $t('exchangeLabels.label') }}</strong>
					<p>{{ $t('echange_options_text') }}</p>
				</template>
			</div>

			<div class="buttons-holder center" v-if="!expanded">
				<v-button
					vType="stroke"
					:to="{ name: 'profile', params: { id: offer.address } }"
				>{{ $t('profileLabels.ads') }}</v-button>
				<v-button @click="expand">{{ $t('buttonLabels.find_exchange_options') }}</v-button>
			</div>
		</div>

		<template v-if="expanded && deals?.length">
			<div class="row block">
				<BarterList
					:items="deals"
					vType="row"
				>
					<template #offer>
						<v-button vType="hit">{{ $t('buttonLabels.offer_an_exchange') }}</v-button>
					</template>
				</BarterList>
			</div>

			<!-- <div class="row center">
				<v-button>{{ $t('buttonLabels.show_more') }}</v-button>
			</div> -->
		</template>

		<template v-else>
			<div class="row block">
				
			</div>
		</template>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>