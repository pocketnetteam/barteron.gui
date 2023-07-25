<template>
	<div :id="id" :style="`height: ${ height }; width: ${ width }`">
		<l-map :style="`height: ${ height }`" :zoom="zoom" :center="center">
			<l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
			<l-marker :lat-lng="markerLatLng"></l-marker>
		</l-map>
	</div>
</template>

<style src="leaflet/dist/leaflet.css"></style>
<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>