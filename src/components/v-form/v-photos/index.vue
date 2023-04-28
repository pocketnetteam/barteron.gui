<template>
	<div :class="{
		'photo-uploader': true,
		'no-files': !count
		}">
		<picture
			v-for="file in files.entries()"
			:key="file[0]"
			:id="file[0]"
		>
			<img :src="file[1].base64" :alt="file[1].name">
			<i class="fa fa-times remove" @click="$event => remove($event, file[0])"></i>
		</picture>
		<div class="add">
			<!-- Hidden input -->
			<input
				:multiple="multiple"
				:accept="mimeTypes"
				type="file"
				@change="uploadImage"
			/>
			<i class="fa fa-plus"></i>
			<span>{{ $t('upload_image') }}</span>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>