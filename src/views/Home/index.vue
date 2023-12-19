<template>
	<div id="content">
		<section v-if="mayMatchExchanges?.length">
			<h1>{{ $t('may_match_exchanges') }}</h1>
			<BarterList
				:items="mayMatchExchanges"
				:carousel="true"
				:customLink="(offer) => ({ name: 'ThreeSidedSearch', query: { source: offer.source.hash, target: offer.hash } })"
			/>
		</section>

		<!-- <section>
			<h1>{{ $t('categoriesLabels.popular') }}</h1>
			<PopularList :items="favorites" />
		</section> -->

		<section v-if="newFromGoods?.length">
			<h1>{{ $t('new_from_goods') }}</h1>
			<BarterList
				:items="newFromGoods"
				:carousel="true"
			/>
		</section>

		<!-- <section>
			<Banner>
				<picture>
					<img :src="require('@/assets/images/banner.jpeg')" alt="banner">
				</picture>
			</Banner>
		</section>

		<section>
			<h1>Services</h1>
			<BarterList
				:items="barters.generate(8)"
			/>
		</section> -->

		<section>
			<h1>Viewed</h1>
			<BarterList
				:items="barters.generate(4)"
			/>
		</section>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>