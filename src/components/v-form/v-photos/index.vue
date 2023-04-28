<template>
	<div :class="{
		'photo-uploader': true,
		'no-files': !files.length
		}">
		<picture
			v-for="(item, index) in files"
			:key="index"
			:id="item.id"
		>
			<img :src="item.image" :alt="item.file.name">
			<i class="fa fa-times remove" @click="() => remove(index)"></i>
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