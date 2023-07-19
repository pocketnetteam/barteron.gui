<template>
	<div class="barter-exchange">
		<strong class="label">{{ $t('barterLabels.select') }}</strong>
		<ul>
			<li
				v-for="(item, index) in items.slice(0, show)" :key="index"
				:class="{ 'selected': selected === index }"
				@click="() => selected = index"
			>
				<i class="fa fa-check-circle"></i>
				<img :src="imageUrl(Array.isArray(item.image) ? item.image[0] : item.image)" :alt="item.name">
			</li>
		</ul>

		<!-- Toggle -->
		<div class="toggle">
			<span class="link" @click.prevent="toggle">
				{{ $t(`toggle.${ show < items.length ? 'show' : 'hide' }_all`) }}
			</span>
		</div>

		<div class="propose">
			<v-button>
				<i class="fa fa-sync"></i>
				<span>{{ $t('buttonLabels.propose_exchange') }}</span>
			</v-button>

			<v-button
				vType="stroke"
				class="btn-group"
			>
				<span>
					<i class="fa fa-users"></i>
					<span>{{ $t('buttonLabels.group_exchange') }}</span>
				</span>
				<ul>
					<li
						v-for="(item, index) in barters.generate(3)" :key="index"
					>
						<img :src="imageUrl(Array.isArray(item.image) ? item.image[0] : item.image)" :alt="item.name">
					</li>
				</ul>
			</v-button>
		</div>

		<div class="buy">
			<v-button vType="roshi">
				<span>{{ $t('buttonLabels.buy_for', { cost: item.price }) }}</span>
			</v-button>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>