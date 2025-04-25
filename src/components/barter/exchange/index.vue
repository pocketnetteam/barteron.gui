<template>
	<div class="barter-exchange">
		<template v-if="exchangeAvailable()">

			<div class="propose">
				<v-button 
					:disabled="isChatLoading()"
					@click="selectOffer"
				>
					<i class="fa fa-sync"></i>
					<span>{{ $t('buttonLabels.propose_exchange') }}</span>
				</v-button>

				<!-- <v-button
					v-if="groupExchange.length"
					vType="bulma-stroke"
					class="btn-group"
					:to="{ name: 'ThreeSidedSearch', query: { source: item.hash, target: items[selected].hash } }"
				>
					<span>
						<i class="fa fa-users"></i>
						<span>{{ $t('buttonLabels.group_exchange') }}</span>
					</span>
					<ul :style="{ '--len': groupExchange.length }">
						<li
							v-for="(item, index) in groupExchange" :key="index"
						>
							<img :src="imageUrl(item.images[0])" :alt="item.name">
						</li>
					</ul>
				</v-button> -->
			</div>
		</template>

		<div class="buy">
			<v-button 
				v-if="purchaseState() === 'startPurchase'"
				:disabled="isChatLoading()"
				@click="startPurchase"
			><span>{{ $t('buttonLabels.start_purchase') }}</span>
			</v-button>

			<template v-if="purchaseState() === 'waitForPickupPoint'">
				<v-button 
					:disabled="isChatLoading()"
					@click="waitForPickupPoint"
				><span>{{ $t('buttonLabels.start_purchase') }}</span>
				</v-button>

				<label
					v-if="purchaseStateLabels"
					id="delivery-option-selection-label"
					class="v-label warning-level"
				>
					<i class="fa fa-chevron-circle-left"></i>
					{{ $t('deliveryLabels.hint_for_delivery_option_selection') }}
				</label>
			</template>

			<template v-if="purchaseState() === 'pickupPointSelected'">
				<v-button 
					vType="hit"
					:disabled="isChatLoading()"
					@click="buyAtSelectedPickupPoint"
				><span>{{ $t('buttonLabels.buy') }}</span>
				</v-button>

				<label
					v-if="purchaseStateLabels"
					id="purchase-label"
					class="v-label warning-level"
				>
					<i class="fa fa-info-circle"></i>
					{{ $t('deliveryLabels.hint_for_purchase_at_pickup_point') }}
				</label>
			</template>

			<!-- <v-button vType="roshi">
				<span>{{ $t('buttonLabels.buy_for', { cost: $n(item.price) }) }}</span>
			</v-button> -->
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>