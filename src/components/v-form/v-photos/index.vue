<template>
	<button class="photo-uploader">
		<!-- Hidden input -->
		<input
			type="file"
			ref="file"
			@change="uploadImage"
		>

		<span class="text">
			<i class="fa fa-plus"></i>
			<span>{{ $t('upload_image') }}</span>
		</span>
	</button>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>