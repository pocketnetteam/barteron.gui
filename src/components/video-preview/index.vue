<template>
	<div class="video-preview">
		<template v-if="thumbnailUrl">
			<img
				class="thumbnail-image"
				:src="imageUrl(thumbnailUrl)"
				:alt="alternateText"
			>
			<div class="play-holder">
				<i class="fa fa-play"></i>
			</div>
		</template>

		<template v-if="!(thumbnailUrl || disableLoader || loadingDataError)">
			<loader type="circular" />
		</template>
		
		<template v-if="loadingDataError">
			<div class="img-error">
				<i class="fa fa-times-circle"></i>
			</div>
		</template>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>