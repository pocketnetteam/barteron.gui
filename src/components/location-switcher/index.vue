<template>
	<v-button
		:class="{
			'location-switcher': true,
			'lightbox-open': lightbox
		}"
		vType="stroke"
		:title="locationStore.geohash ? lastAddr : ''"
		@click="showLightbox"
	>
		<i
			:class="`fa fa-map-marker-alt${ !locationStore.geohash ? ' slash' : '' }`"
		></i>
		<div class="info">
			<strong class="location">
				<template v-if="locationStore.geohash && !lastAddr"><i class="fa fa-spin fa-spinner"></i></template>
				<template v-else>{{ locationStore.geohash ? lastAddr : $t('buttonLabels.unknown') }}</template>
			</strong>
			<!-- <span class="distance">{{ (radius || 10) + $t('metricsLabels.km') }}</span> -->
		</div>

		<template #after>
			<v-lightbox
				:visible="lightbox"
				size="xl"
				title="Location"
				@onHide="hideLightbox"
			>
				<v-form ref="form">
					<div class="row info">
						<i class="fa fa-map-marker-alt"></i>
						<span>
							<template v-if="!address"><i class="fa fa-spin fa-spinner"></i></template>
							<template v-else>{{ address || $t('buttonLabels.unknown') }}</template>
						</span>
					</div>

					<div class="row full-width">
						<div class="col block full-width no-offset">
							<!-- Label: Radius -->
							<label for="radius" class="v-label">{{ $t('locationLabels.radius') }}</label>

							<div class="col range">
								<!-- Component: vInput -->
								<v-input
									id="radius"
									name="radius"
									type="range"
									min="1"
									max="6000"
									:value="radius"
									:vEvents="{
										change: changeRadius,
										input: changeRadius
									}"
								/>
								<span class="value">{{ `${ radius } ${ $t('metricsLabels.km') }` }}</span>
							</div>
						</div>

						<div class="col block no-offset">
							<v-button
								:disabled="nearbyDisabled"
								@click="showNearby"
							>{{ $t('buttonLabels.show_nearby_on_map') }}</v-button>
						</div>
					</div>

					<div class="row">
						<!-- vMap -->
						<v-map
							ref="map"
							:center="location"
							:allowPosition="true"
							:allowSelection="true"
							:zoom="locationStore.zoom || undefined"
							:radius="radius || undefined"
							:offers="offersNear"
							@scale="x => zoom = x"
							@change="setMarker"
						/>
					</div>
				</v-form>

				<template #footer>
					<div class="row full-width right">
						<div class="buttons-holder">
							<v-button
								:disabled="!locationStore.geohash"
								@click="reset"
							>{{ $t('buttonLabels.all_regions') }}</v-button>
							<v-button
								:disabled="saveDisabled"
								@click="submit"
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