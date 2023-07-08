<template>
	<v-content class="shrink">
		<div class="my-barter-holder">
			<div class="row center">
				<div :class="{
					'my-barter': true,
					'small': exchangeOptions
				}">
					<router-link :to="{ name: 'barterItem', params: { id: 123 } }">
						<img src="@/assets/images/barter/macbook-2.jpeg" alt="barter-name">
					</router-link>
				</div>
			</div>

			<div class="row dir-column center">
				<template v-if="!exchangeOptions">
					<strong class="title">{{ $t('find_exchange_options') }}</strong>
				</template>
				<template v-else>
					<strong class="title">{{ $t('exchange_options') }}</strong>
					<p>{{ $t('echange_options_text') }}</p>
				</template>
			</div>

			<div class="buttons-holder center" v-if="!exchangeOptions">
				<v-button vType="stroke">{{ $t('buttonLabels.my_announcements') }}</v-button>
				<v-button @click="() => exchangeOptions = true">{{ $t('buttonLabels.find_exchange_options') }}</v-button>
			</div>
		</div>

		<template v-if="exchangeOptions">
			<div class="row block">
				<BarterList
					:items="barters.generate(8)"
					vType="row"
				>
					<template #offer>
						<v-button vType="hit">{{ $t('buttonLabels.offer_an_exchange') }}</v-button>
					</template>
				</BarterList>
			</div>

			<div class="row center">
				<v-button>{{ $t('buttonLabels.show_more') }}</v-button>
			</div>
		</template>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>