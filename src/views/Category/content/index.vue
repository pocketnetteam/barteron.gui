<template>
	<v-content 
		class="category-content"
		:class="isHomeRoute ? 'home-page' : ''"
	>

		<!-- Top panel -->
		<div 
			v-if="!(isHomeRoute)"
			class="barter-list-settings row"
		>

			<!-- Filter -->
			<div class="filter">
				<v-button
					:vType="filtersEnabled() ? 'hit' : 'stroke'"
					:class="{
						'filter-enabled': filtersEnabled(),
					}"
					vSize="md"
					@click="filterClick"
				>
					<i class="fa fa-filter"></i>
					<span class="title">Фильтр</span>
				</v-button>
			</div>

			<!-- Order and view type -->
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
			<!-- Offer list -->
			<BarterList
				v-if="items?.length"
				:class="isHomeRoute ? 'home-page' : ''"
				keyPrefix="category"
				:items="items"
				:vType="isHomeRoute ? 'tile' : bartersView"
			/>

			<!-- Loader -->
			<loader 
				v-if="isLoading" 
				type="circular" 
				align="top"
			/>

			<!-- Empty list info -->
			<p 
				v-if="!(items?.length || isLoading || loadingError)" 
				class="category-label"
			>{{ $t('categoryLabels.empty') }}</p>

			<!-- Viewing parent category -->
			<section v-if="!(locationFilterEnabled()) && viewingParentCategory">
				<i18n
					class="top-category-link-holder category-label includes-button"
					path="categoryLabels.view_top_parent"
					tag="p"
				>
					<template #all_offers>
						<v-button
							class="inline-button"
							vSize="sm"
							:to="{ name: 'category', params: { id: viewingParentCategory.id } }"
						>{{ $t('buttonLabels.all_offers') }}</v-button>
					</template>

					<template #category_name>
						<span>"{{ $t(viewingParentCategory.name) }}"</span>
					</template>
				</i18n>
			</section>

			<!-- Location filter info -->
			<section v-if="locationFilterEnabled() && !(isLoading || loadingError)">

				<!-- Not empty list -->
				<i18n
					v-if="items?.length"
					class="location-filter-link-holder category-label bold-label"
					path="categoryLabels.not_empty_list_with_locaction_filter_details"
					tag="p"
				>
					<template #map>
						<a 
							class="link" 
							href="#"
							@click.prevent="openLocationFilter"
						><u>{{ $t('categoryLabels.map_link') }}</u></a>
					</template>
				</i18n>

				<!-- Empty list -->
				<i18n
					v-else
					class="location-filter-link-holder category-label includes-button"
					path="categoryLabels.empty_list_with_locaction_filter_details"
					tag="p"
				>
					<template #map>
						<a 
							class="link" 
							href="#"
							@click.prevent="openLocationFilter"
						><u>{{ $t('categoryLabels.map_link') }}</u></a>
					</template>

					<template #all_regions>
						<v-button
							class="inline-button"
							vSize="sm"
							@click="reset"
						>{{ $t('buttonLabels.all_regions') }}</v-button>
					</template>
				</i18n>
			</section>
		</div>

		<div 
			v-if="items?.length && !(loadingError || isLoading || allItemsAreLoaded)"
			class="row center"
		>
			<div 
				v-intersection="showMoreEvent" 
				style="width: 100%; height: 20px;"
			/>
		</div>

		<div 
			v-if="loadingError"
			class="categories-loading-error-holder"
		>
			<p class="error">{{ loadingErrorMessage() }}</p>
			<v-button
				@click="repeatLoading"
			>
				<i class="fa fa-redo"></i>
				<span>{{ $t("buttonLabels.repeat") }}</span>
			</v-button>
		</div>

	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>