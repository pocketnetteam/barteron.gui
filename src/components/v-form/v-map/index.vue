<template>
	<div :id="id" :style="`height: ${ height }; width: ${ width }`">
		<l-map ref="map" :style="`height: ${ height }`" :zoom="zoom" :center="marker || center">
			<template v-if="allowPosition">
				<l-circle
					:latLng="center"
					:radius="50"
					:stroke="false"
					:fillColor="'#136aec'"
					:fillOpacity="0.15"
				/>
				<l-circle-marker
					:latLng="center"
					:radius="9"
					:color="'#fff'"
					:fillColor="'#2a93ee'"
					:fillOpacity="1"
				/>

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

			<template v-if="allowSelection">
				<l-marker :latLng="marker" v-if="marker" />
				<l-geosearch :options="geosearchOptions" />
			</template>

			<l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
		</l-map>
	</div>
</template>

<style src="leaflet/dist/leaflet.css"></style>
<style src="leaflet-geosearch/assets/css/leaflet.css"></style>
<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>