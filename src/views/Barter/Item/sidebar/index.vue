<template>
	<v-sidebar>
		<div class="box">
			<Caption :item="item"/>
			<Price :item="item"/>

			<div class="row t-sep">
				<!-- My offer -->
				<MyOptions
					v-if="isMyOffer"
					:item="item"
					@withdrawOffer="withdrawOfferDialog(item, false)"
					@renewOffer="renewOfferDialog(item)"
					@removeOffer="withdrawOfferDialog(item, true)"
				/>

				<!-- Someone's offer -->
				<BarterExchange
					v-if="!isMyOffer"
					:purchaseStateLabels="true"
				/>
			</div>
		</div>

		<div class="box">
			<Profile :hash="address" />
			<ExchangeList
				v-if="isMyOffer"
				:tags="account?.tags || []"
				@change="(tags) => account.set({ tags })"
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