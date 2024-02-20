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

		<section>
			<template>
				<h1>{{ $t('new_from_goods') }}</h1>
				<BarterList
					:items="newFromGoods"
					:loaderState="fetching"
					:carousel="true"
				/>
			</template>
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

		<section v-if="viewedList?.length">
			<h1>Viewed</h1>
			<BarterList
				:items="viewedList"
				:carousel="true"
			/>
		</section>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>