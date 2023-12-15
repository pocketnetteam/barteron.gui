<template>
	<v-button
		:class="{
			'location-switcher': true,
			'lightbox-open': lightbox
		}"
		vType="stroke"
		@click="showLightbox"
	>
		<i
			:class="`fa fa-map-marker-alt${ !address ? ' slash' : '' }`"
		></i>
		<div class="info">
			<strong class="location">
				<template>{{ address ?? $t('buttonLabels.unknown') }}</template>
			</strong>
			<span class="distance">{{ address ? (radius || 0) + $t('metricsLabels.km') : '~' }}</span>
		</div>

		<template #after>
			<v-lightbox
				:visible="lightbox"
				size="md"
				title="Location"
				@onHide="hideLightbox"
			>
				<v-form ref="form">
					<div class="row info">
						<i class="fa fa-map-marker-alt"></i>
						<span>
							<template>{{ address ?? $t('buttonLabels.unknown') }}</template>
						</span>
					</div>

					<div class="row full-width">
						<div class="col block no-offset">
							<!-- Label: Static or dynamic location -->
							<label for="static" class="v-label">{{ $t('locationLabels.preferred') }}</label>

							<!-- vSwitch (Slide) -->
							<v-switch
								id="static"
								type="radio"
								vType="slide"
								:name="['static', 'static']"
								:checked="mapType"
								:label="[$t('locationLabels.dynamic'), $t('locationLabels.static')]"
								:value="['dynamic', 'static']"
							/>
						</div>

						<div class="col block no-offset">
							<!-- Label: Radius -->
							<label for="radius" class="v-label">{{ $t('locationLabels.radius') }}</label>

							<div class="col">
								<!-- Component: vInput -->
								<v-input
									id="radius"
									name="radius"
									type="number"
									min="0"
									max="9999"
									:value="account.radius || 0"
								/>
								&nbsp;{{ $t('metricsLabels.km') }}
							</div>
						</div>
					</div>

					<div class="row">
						<!-- vMap -->
						<v-map
							ref="map"
							:center="mapType === 'static' ? geohash : (location || undefined)"
							:allowPosition="true"
							:allowSelection="true"
							v-if="lightbox"
						/>
					</div>
				</v-form>

				<template #footer>
					<div class="row full-width right">
						<div class="buttons-holder h-w">
							<v-button @click="submit">{{ $t('buttonLabels.save') }}</v-button>
						</div>
					</div>
				</template>
			</v-lightbox>
		</template>
	</v-button>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>