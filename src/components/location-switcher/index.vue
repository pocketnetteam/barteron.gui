<template>
	<v-button
		:class="{
			'location-switcher': true,
			'lightbox-open': lightbox
		}"
		vType="light"
		:title="locationStore.geohash ? lastAddr : ''"
		@click="showLightbox"
	>
		<i
			:class="`fa fa-map-marker-alt${ !locationStore.geohash ? ' slash' : '' }`"
		></i>
		<div class="info">
			<strong class="location">
				<template v-if="locationStore.geohash && !lastAddr"><i class="fa fa-spin fa-spinner"></i></template>
				<template v-else>{{ locationStore.geohash ? lastAddr : $t('buttonLabels.set_location') }}</template>
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
							:center="location"
							:zoom="locationStore.zoom || undefined"
							:mapActionData="mapActionData"
							:addressInfo="address"
							@scale="setZoom"
							@change="setCenter"
							@bounds="setBounds"
							@mapAction="mapAction"
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
								:disabled="saveDisabled || !(location)"
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