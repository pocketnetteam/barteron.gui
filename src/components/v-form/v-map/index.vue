<template>
	<div
		:id="id"
		:style="{ height, width, '--height': height, '--width': width }"
	>
		<l-map
			ref="map"
			:style="{ height }"
			:zoom="zoom"
			:max-zoom="maxZoom"
			:center="marker || center"
		>
			<!-- Offers near -->
			<template v-if="shownOffers.length">
				<l-marker-cluster>
					<l-marker v-for="offer in shownOffers"
						:lat-lng="decodeGeoHash(offer.geohash)"
						:key="offer.hash"
					>
						<l-icon
							:icon-size="iconSize"
							:icon-url="isViewMode ? offerIconActive : offerIcon"
							:icon-anchor="iconAnchor"
						>
						</l-icon>
						<l-tooltip v-if="!(isViewMode)">{{ offer.caption }}</l-tooltip>
						<l-popup v-if="!(isViewMode)">
							<BarterItem
								:item="offer"
							/>
						</l-popup>
					</l-marker>
				</l-marker-cluster>
			</template>

			<!-- Find my location -->
			<template v-if="(isSearchMode || isInputMode)">
				<l-control position="topleft">
					<div class="leaflet-bar">
						<a
							class="leaflet-control-location"
							href="#"
							role="button"
							@click.prevent="toggleAddressSearch"
						>
							<i class="fa fa-search"></i>
						</a>
					</div>
				</l-control>

				<l-control position="bottomleft">
					<div class="leaflet-bar">
						<a
							class="leaflet-control-location"
							href="#"
							role="button"
							@click.prevent="setLocation"
						>
							<i class="fa fa-location-arrow"></i>
						</a>
					</div>
				</l-control>
			</template>

			<!-- Pin marker -->
			<template v-if="(isSearchMode || isInputMode)">
				<l-marker v-if="isInputMode && marker" :latLng="marker" />
				<l-geosearch :options="geosearchOptions" />
			</template>

			<l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
		</l-map>
		<div 
			v-if="isSearchMode" 
			class="offers-search-container"
		>
			<div
				v-if="loadingError && loadingErrorMessage"
				class="offers-loading-error"
			>
				<p class="error-message"> {{ loadingErrorMessage }} </p>
			</div>
			<v-button 
				v-if="offersSearchButton"
				class="offers-search-button"
				vSize="sm"
				:rippleEffect="false"
				@click="searchOffersEvent"
			>
				<i class="fa fa-search"></i>
				<span>{{ $t('buttonLabels.search_in_visible_area') }}</span>
			</v-button>
			<v-button 
				v-if="offersLoadMoreButton"
				class="offers-load-more-button"
				vSize="sm"
				:rippleEffect="false"
				@click="loadMoreOffersEvent"
			>
				<i class="fa fa-plus-circle"></i>
				<span>{{ $t('buttonLabels.show_more') }}</span>
			</v-button>
			<div
				v-if="isLoading"
				class="offers-loading"
			>
				<i class="fa fa-spinner fa-spin"></i>
			</div>
		</div>
	</div>
</template>

<style src="leaflet/dist/leaflet.css"></style>
<style src="leaflet-geosearch/assets/css/leaflet.css"></style>
<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>