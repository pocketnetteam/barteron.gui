<template>
	<v-content>

		<!-- show app banner -->
		<template v-if="!(appBannerDisabled)">
			<div class="app-banner-holder">
				<div class="app-banner">
					<div class="app-banner-content box">
						<h1 class="title">{{ $t('appBannerLabels.title') }}</h1>
						<h1 class="info row">
							{{ $t('appBannerLabels.paragraph1') }}
						</h1>
						<h1 class="info row">
							{{ $t('appBannerLabels.paragraph2') }}
						</h1>

						<div class="row full-width center">
							<div class="buttons-holder min-h-w">
								<v-button 
									id="open-apps-link-button"
									vType="hit"
									@click="openAppsLink"
								>
									{{ $t('buttonLabels.download_app') }}
								</v-button>
							</div>
						</div>

						<div class="col">
							<p class="important">
								{{ $t('appBannerLabels.important') }}
							</p>
							<p class="details">
								{{ $t('appBannerLabels.details') }}
							</p>
							<h1 class="info">
								{{ appsLink }}
							</h1>
						</div>
						<div id="app-banner-checkbox-holder">
							<v-switch
								class="no-padding"
								type="checkbox"
								name="appBannerDisabled"
								:label="$t('appBannerLabels.dont_show_again')"
								vType="checkbox"
								vSize="xl"
								@change="appBannerDisabledChange"
							/>
						</div>
						<div 
							id="hide-button-holder"
							class="row full-width right"
						>
							<div class="buttons-holder min-h-w">
								<v-button
									id="hide-button"
									@click="hideAppBanner"
								>
									<span>{{ $t('buttonLabels.continue_working') }}</span>
								</v-button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</template>

		<!-- show offers -->
		<template v-if="appBannerDisabled">
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
						<p>{{ $t('exchangeLabels.text') }}</p>
					</template>
				</div>

				<div class="buttons-holder center" v-if="!expanded">
					<v-button
						vType="stroke"
						:to="{ name: 'profile', params: { id: offer.address } }"
					>{{ $t('profileLabels.offers') }}</v-button>
					<v-button @click="expand">{{ $t('buttonLabels.find_exchange_options') }}</v-button>
				</div>
			</div>

			<template v-if="expanded">
				<div
					class="row block"
					v-if="deals?.length"
				>
					<BarterList
						keyPrefix="deals"
						:items="deals"
						vType="row"
					>
						<template #offer="{ item }">
							<v-button 
								:disabled="isLoading"
								@click="proposeExchange(item)" vType="hit"
							>{{ $t('buttonLabels.offer_an_exchange') }}
							</v-button>
						</template>
					</BarterList>
				</div>

				<div
					class="row center"
					v-else
				>
					<p>{{ $t('exchangeLabels.empty') }}</p>
				</div>

				<!-- <div class="row center">
					<v-button>{{ $t('buttonLabels.show_more') }}</v-button>
				</div> -->
			</template>
		</template>

	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>