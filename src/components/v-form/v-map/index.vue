<template>
	<div
		:id="id"
		:style="{ height, width, '--height': height, '--width': width }"
		:class="{ 'dark-theme': isDarkTheme }"
	>
		<l-map
			ref="map"
			:style="{ height }"
			:zoom="zoom"
			:max-zoom="maxZoom"
			:center="center"
		>
			<!-- Offers near -->
			<template v-if="shownOffers.length">
				<l-marker-cluster>
					<l-marker v-for="offer in shownOffers"
						:lat-lng="decodeGeoHash(offer.geohash)"
						:key="offer.hash"
					>
						<l-icon
							:icon-size="getOfferIcon(offer).size"
							:icon-url="getOfferIcon(offer).url"
							:icon-anchor="getOfferIcon(offer).anchor"
						>
						</l-icon>
						
						<l-tooltip
							v-if="!(isViewMode || isDeliverySelectionMode && !(offer.isPickupPoint || offer.isSelfPickup))"
						>{{ offer.caption }}</l-tooltip>

						<l-popup v-if="!(isViewMode || isDeliverySelectionMode && !(offer.isPickupPoint || offer.isSelfPickup))">
							<PickupPointItem 
								v-if="(isDeliveryInputMode || isDeliverySelectionMode) && (offer.isPickupPoint || offer.isSelfPickup)"
								:item="offer"
								role="popup"
								:mode="pickupPointPopupMode"
								:isSelected="isSelectedOffer(offer)"
								@showItem="showPickupPoint"
								@selectItem="selectPickupPoint"
								@unselectItem="unselectPickupPoint"
								@buyAtItem="buyAtPickupPoint"
							/>
							<BarterItem 
								v-else
								:item="offer"
							/>
						</l-popup>
					</l-marker>
				</l-marker-cluster>
			</template>

			<!-- Find my location -->
			<template>
				<l-control position="topleft">
					<div class="leaflet-bar">
						<a
							class="leaflet-control-search"
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
						<div
							v-if="userLocationIsLoading" 
							class="location-spinner"
						>
							<i class="fa fa-spinner fa-spin"></i>
						</div>
						<a
							v-else
							class="leaflet-control-location"
							href="#"
							role="button"
							@click.prevent="startLocating"
						>
							<i class="fa fa-location-arrow"></i>
						</a>
					</div>
				</l-control>
			</template>

			<!-- Pin marker -->
			<template>
				<l-marker v-if="(isInputMode || isDeliveryInputMode || isViewMode || isDeliverySelectionMode) && marker" :latLng="marker" />
				<l-geosearch :options="geosearchOptions" />
			</template>

			<l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
		</l-map>
		<div 
			v-if="(isSearchMode || isDeliveryInputMode)" 
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

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>