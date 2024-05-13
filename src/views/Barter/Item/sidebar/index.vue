<template>
	<v-sidebar>
		<div class="box">
			<h1 class="title">{{ item?.caption }}</h1>
			<span class="price row">
				<template v-if="item?.price">
					<span class="col">
						<span class="currency icon-pkoin"></span>
						<span class="amount">{{ $n(item?.price) }}</span>
						<span>{{ $t('profileLabels.coins') }}</span>
					</span>
					<span class="col">
						<CurrencySwitcher
							:amount="item?.price"
							:hideButton="true"
						/>
					</span>
				</template>
				<template v-else>
					<span class="currency fa fa-gift"></span>
					<span class="amount">{{ $t('barterLabels.free') }}</span>
				</template>
			</span>

			<div class="row t-sep">
				<!-- My offer -->
				<template v-if="isMyOffer">
					<div class="buttons">
						<v-button :to="{ name: 'createBarter', params: { id: item?.hash, from: $route.params.from } }">
							<template v-if="!isPreview">
								<i class="fa fa-pen"></i>
								<span>{{ $t('buttonLabels.edit') }}</span>
							</template>
							<template v-else>
								<i class="fa fa-undo"></i>
								<span>{{ $t('buttonLabels.continue_edit') }}</span>
							</template>
						</v-button>

						<v-button
							vType="hit"
							:to="{ name: 'exchangeOptions', params: { id: item?.hash }, query: { expanded: 1 } }"
						>
							<i class="fa fa-sync"></i>
							<span>{{ $t('buttonLabels.find_exchange_options') }}</span>
						</v-button>

						<template v-if="!isPreview">
							<v-button vType="bulma-stroke">
								<i class="fa fa-undo"></i>
								<span>{{ $t('buttonLabels.withdraw') }}</span>
							</v-button>

							<v-button vType="dodoria-stroke">
								<i class="fa fa-trash"></i>
								<span>{{ $t('buttonLabels.remove') }}</span>
							</v-button>
						</template>
					</div>
				</template>

				<!-- Someone's offer -->
				<BarterExchange
					v-if="!isMyOffer"
					:item="item"
					:items="myOffers"
					@propose="createRoom"
					@contact="createRoom"
				/>
			</div>
		</div>

		<div class="box">
			<Profile :hash="address" />
			<ExchangeList
				:tags="account?.tags || []"
				@change="(tags) => account.set({ tags })"
				v-if="isMyOffer"
			>
				<template #after>
					<dl class="list">
						<dt>{{ $t('metricsLabels.number') }}</dt>
						<dd>{{ item?.hash }}</dd>
					</dl>

					<!-- <a class="report" href="#"><i class="fa fa-flag"></i> {{ $t('profileLabels.report_abuse') }}</a> -->
				</template>
			</ExchangeList>
		</div>
	</v-sidebar>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>