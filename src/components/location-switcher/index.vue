<template>
	<v-button
		:class="{
			'location-switcher': true,
			'lightbox-open': lightbox
		}"
		vType="ghost"
		@click="showLightbox"
	>
		<i class="fa fa-map-marker-alt"></i>
		<div class="info">
			<strong class="location">Kazakhstan, Astana</strong>
			<span class="distance">200км</span>
		</div>

		<template v-slot:after>
			<v-lightbox
				:visible="lightbox"
				size="sm"
				title="Location"
				@onHide="hideLightbox"
			>
				just content
				just content
				just content
				just content
				just content
				just content
				just content
				just content
				just content
				just content
				just content
				just content
				just content
				just content
				just content
				just content
			</v-lightbox>
		</template>
	</v-button>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>