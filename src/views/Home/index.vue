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

		<section v-if="viewedList?.length">
			<h1>{{ $t('profileLabels.viewed') }}</h1>
			<BarterList
				:items="viewedList"
				:carousel="true"
			/>
		</section>

		<section>
			<h1>{{ $t('profileLabels.ads') }}</h1>
		</section>

		<!-- <section>
			<template>
				<h1 v-if="fetching || newFromGoods.length">{{ $t('new_from_goods') }}</h1>
				<BarterList
					:items="newFromGoods"
					:loaderState="fetching"
					:carousel="true"
					:showForwardButton="!(fetching) && newFromGoods.length > 4"
					@forwardButtonClick="showNewOffers"
				/>
				<template v-if="!fetching && !newFromGoods.length">
					<p>{{ $t('categoryLabels.empty') }}</p>
					<i18n
						path="categoryLabels.empty_details"
						tag="p"
					>
						<template #all_regions>
							<v-button
								@click="reset"
							>{{ $t('buttonLabels.all_regions') }}</v-button>
						</template>
					</i18n>
				</template>
			</template>
		</section> -->

	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>