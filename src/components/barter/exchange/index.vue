<template>
	<div class="barter-exchange">
		<template v-if="items.length">

			<div class="propose">
				<v-button 
					:disabled="isLoading"
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
				:disabled="isLoading"
				@click="contactSeller"
			><span>{{ $t('buttonLabels.contact_seller') }}</span>
			</v-button>

			<!-- <v-button vType="roshi">
				<span>{{ $t('buttonLabels.buy_for', { cost: $n(item.price) }) }}</span>
			</v-button> -->
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>