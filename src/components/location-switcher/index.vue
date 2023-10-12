<template>
	<v-button
		:class="{
			'location-switcher': true,
			'lightbox-open': lightbox
		}"
		vType="stroke"
		@click="showLightbox"
	>
		<i class="fa fa-map-marker-alt"></i>
		<div class="info">
			<strong class="location" v-if="address">{{ address.country }}, {{ address.city || address.town || address.county }}</strong>
			<span class="distance">{{ radius }}{{ $t('metrics.km') }}</span>
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
						<span v-if="address">{{ address.country }}, {{ address.city || address.town || address.county }}</span>
					</div>

					<div class="row full-width">
						<div class="col block no-offset">
							<!-- Label: Static or dynamic location -->
							<label for="static" class="v-label">{{ $t('location.preferred') }}</label>

							<!-- vSwitch (Slide) -->
							<v-switch
								id="static"
								type="radio"
								vType="slide"
								:name="['static', 'static']"
								:checked="mapType"
								:label="[$t('location.dynamic'), $t('location.static')]"
								:value="['dynamic', 'static']"
							/>
						</div>

						<div class="col block no-offset">
							<!-- Label: Radius -->
							<label for="radius" class="v-label">{{ $t('location.radius') }}</label>

							<div class="col">
								<!-- Component: vInput -->
								<v-input
									id="radius"
									name="radius"
									type="number"
									min="0"
									max="9999"
									:value="account.radius"
								/>
								&nbsp;{{ $t('metrics.km') }}
							</div>
						</div>
					</div>

					<div class="row">
						<!-- vMap -->
						<v-map
							ref="map"
							:center="mapType === 'static' ? geohash : location"
							:allowPosition="true"
							:allowSelection="true"
							v-if="lightbox"
						/>
					</div>
				</v-form>

				<template #footer>
					<div class="row full-width right">
						<div class="buttons-holder h-w">
							<v-button @click="submit">{{ $t('location.save') }}</v-button>
						</div>
					</div>
				</template>
			</v-lightbox>
		</template>
	</v-button>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>