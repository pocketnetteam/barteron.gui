<template>
	<div class="barter-exchange">
		<template v-if="items.length">
			<v-lightbox
				size="md"
				:visible="lightbox"
				:title="$t('barterLabels.select')"
				@onHide="() => lightbox = false"
			>
				<ul>
					<li
						v-for="(item, index) in items"
						:key="index"
						:class="{ 'selected': selected === index }"
						@click="() => selected = index"
					>
						<i class="fa fa-check-circle"></i>
						<img :src="imageUrl(item.images[0])" :alt="item.name">
					</li>
				</ul>

				<div class="propose">
					<v-button
						:disabled="!items[selected]"
						@click="proposeExchange"
					>
						<span>{{ $t('buttonLabels.propose_exchange') }}</span>
					</v-button>
				</div>
			</v-lightbox>

			<div class="propose">
				<v-button @click="() => lightbox = true">
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
			<v-button @click="contactSeller">
				<span>{{ $t('buttonLabels.contact_seller') }}</span>
			</v-button>

			<!-- <v-button vType="roshi">
				<span>{{ $t('buttonLabels.buy_for', { cost: $n(item.price) }) }}</span>
			</v-button> -->
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>