<template>
	<div id="content">
		<section>
			<CategoriesPreview />
		</section>

		<section v-if="mayMatchExchanges?.length">
			<h1>{{ $t('may_match_exchanges') }}</h1>
			<BarterList
				keyPrefix="complex_deals"
				:items="mayMatchExchanges"
				:carousel="true"
				:hideInfo="true"
				:compactView="true"
				:customLink="(offer) => ({ name: 'ThreeSidedSearch', query: { source: offer.source.hash, target: offer.hash } })"
			/>
		</section>

		<section v-if="viewedList?.length">
			<h1>{{ $t('profileLabels.viewed') }}</h1>
			<BarterList
				keyPrefix="viewed"
				:items="viewedList"
				:carousel="true"
				:hideInfo="true"
				:compactView="true"
			/>
		</section>

		<section v-if="legalInfoAvailable">
			<h1>{{ $t('legalLabels.label') }}</h1>
			<LegalInfo
				:i18nDocumentKeys="requiredLegalInfoItemKeys"
			/>
		</section>

		<section>
			<h1>{{ $t('new_offers') }}</h1>
		</section>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>