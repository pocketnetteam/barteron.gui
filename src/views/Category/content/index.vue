<template>
	<v-content v-if="!(isEmptyListFromFullSearch())">
		<div 
			v-if="!(isHomeRoute)"
			class="barter-list-settings row"
		>
			<div class="filter">
				<v-button
					:vType="filtersEnabled() ? 'hit' : 'stroke'"
					vSize="md"
					@click="filterClick"
				>
					<i class="fa fa-filter"></i>
					<span class="title">Фильтр</span>
				</v-button>
			</div>

			<div class="orders-barters-view-group">
				<div class="orders">
					<v-select
						ref="order"
						:dropdown="orders.map(order => ({
							text: `
								<i class='fa icon ${ ordersIcon[order.value] }'></i>
								<span class='title'>${ $t(`orderLabels.${ order.value }`) }</span>
							`,
							value: order.value
						}))"
						@selected="selectOrderEvent"
					/>
				</div>

				<div class="barters-view">
					<v-select
						ref="bartersView"
						:dropdown="views.map(view => ({
							text: `
								<i class='fa icon ${ bartersViewIcon[view.value] }'></i>
								<span class='title'>${ $t(`viewLabels.${ view.value }`) }</span>
							`,
							value: view.value
						}))"
						@selected="selectViewEvent"
					/>
				</div>
			</div>
		</div>

		<div class="row category-holder">
			<BarterList
				v-if="items?.length"
				:class="isHomeRoute ? 'home-page' : ''"
				:items="items"
				:vType="isHomeRoute ? 'tile' : bartersView"
			/>

			<loader 
				v-else-if="!(items?.length) && isLoading" 
				type="circular" 
				align="top"
			/>

			<p 
				v-else 
				class="category-label"
			>{{ $t('categoryLabels.empty') }}</p>

			<section v-if="viewingParentCategory">
				<i18n
					class="top-category-link-holder category-label"
					path="categoryLabels.view_top_parent"
					tag="p"
				>
					<template #all_offers>
						<v-button
							:to="{ name: 'category', params: { id: viewingParentCategory.id } }"
						>{{ $t('buttonLabels.all_offers') }}</v-button>
					</template>

					<template #category_name><span>"{{ $t(viewingParentCategory.name) }}"</span></template>
				</i18n>
			</section>
		</div>

		<div class="row center">
			<div 
				v-if="!(isLoading) && items?.length && !(allItemsAreLoaded)"
				v-intersection="showMoreEvent" 
				style="width: 100%; height: 20px;"
	        />
			<loader 
				v-else-if="items?.length && isLoading" 
				type="circular" 
				align="top"
			/>
		</div>
	</v-content>

	<v-content v-else>
		<section>
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
		</section>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>