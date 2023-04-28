<template>
	<div :class="{
		'photo-uploader': true,
		'no-files': !files.length,
		'dragover': drag
		}"
		@drop="upload"
	>
		<picture
			v-for="(item, index) in files"
			:key="index"
			:id="item.id"
			@click="() => makeFirst(index)"
		>
			<div class="img-holder">
				<img :src="item.image" :alt="item.file.name">
			</div>
			<i class="fa fa-times remove" @click="$event => remove($event, index)"></i>
		</picture>

		<div class="add" v-if="!max || files.length < max">
			<!-- Hidden input -->
			<input
				:multiple="multiple"
				:accept="mimeTypes"
				type="file"
				@change="upload"
			/>
			<i class="fa fa-plus"></i>
			<span>{{ $t('upload_image') }}</span>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>