<template>
	<div :id="id" :style="{ height, width, '--height': height, '--width': width }">
		<l-map ref="map" :style="{ height }" :zoom="zoom" :center="marker || center">
			<template v-if="allowPosition">
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

			<template v-if="allowSelection && (marker || point)">
				<l-marker :latLng="marker || point" />
				<l-circle
					:latLng="marker || point"
					:radius="radius * 1000"
					:stroke="false"
					:fillColor="'#136aec'"
					:fillOpacity="0.15"
				/>
				<l-geosearch :options="geosearchOptions" />
			</template>

			<template v-if="!allowSelection && point">
				<l-circle
					:latLng="point || {lat: center?.[0], lng: center?.[1]}"
					:radius="50"
					:stroke="false"
					:fillColor="'#136aec'"
					:fillOpacity="0.15"
				/>
				<l-circle-marker
					:latLng="point || {lat: center?.[0], lng: center?.[1]}"
					:radius="9"
					:color="'#fff'"
					:fillColor="'#2a93ee'"
					:fillOpacity="1"
				/>
			</template>

			<l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
		</l-map>
	</div>
</template>

<style src="leaflet/dist/leaflet.css"></style>
<style src="leaflet-geosearch/assets/css/leaflet.css"></style>
<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>