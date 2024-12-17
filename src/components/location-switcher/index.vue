<template>
	<v-button
		id="location-switcher-button"
		:class="{
			'location-switcher': true,
			'lightbox-open': lightbox
		}"
		vType="light"
		:title="searchRegionDefined ? storedLocationAddress.text : ''"
		@click="showLightbox"
	>
		<i
			:class="`fa fa-map-marker-alt${ !searchRegionDefined ? ' slash' : '' }`"
		></i>
		<div class="info">
			<strong class="location">
				<template v-if="searchRegionDefined && storedLocationAddress.isLoading"><i class="fa fa-spin fa-spinner"></i></template>
				<template v-else>{{ 
						searchRegionDefined && storedLocationAddress.text ? 
						storedLocationAddress.text 
						: $t('buttonLabels.set_location') 
				}}</template>
			</strong>
		</div>

		<template #after>
			<v-lightbox
				:visible="lightbox"
				size="xl"
				:title="$t('stepsLabels.location')"
				@onHide="hideLightbox"
			>
				<v-form ref="form">
					<div class="row">
						<!-- vMap -->
						<v-map
							ref="map"
							mapMode="search"
							height="55vh"
							:center="geohash"
							:zoom="locationStore.zoom || undefined"
							:mapActionData="mapActionData"
							:addressInfo="currentAddress.text"
							@scale="setZoom"
							@change="setCenter"
							@bounds="setBounds"
							@geosearch_showlocation="geosearch_showlocation"
							@mapAction="mapAction"
						/>
					</div>
				</v-form>

				<template #footer>
					<div class="row full-width right">
						<div class="buttons-holder">
							<v-button
								vType="stroke"
								:rippleEffect="false"
								@click="help"
							><i class="fa fa-question"></i>
							</v-button>
							<v-button
								:rippleEffect="false"
								:disabled="!(resetRegionButtonEnabled)"
								@click="reset"
							>{{ $t('buttonLabels.all_regions') }}</v-button>
							<v-button
								:rippleEffect="false"
								:disabled="!(saveRegionButtonEnabled)"
								@click="saveRegionEvent"
							>{{ $t('buttonLabels.save') }}</v-button>
						</div>
					</div>
				</template>
			</v-lightbox>
		</template>
	</v-button>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>