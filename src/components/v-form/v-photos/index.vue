<template>
	<ul :class="{
		'photo-uploader': true,
		'no-files': !files.length,
		'dragover': drag
		}"
		@paste="clipboard"
		@drop="prepare"
		@dragstart="dragStart"
		@dragend="dragEnd"
	>
		<li
			v-for="(item, index) in files"
			:key="index"
			:id="item.id"
			draggable="true"
			@click="() => makeFirst(index)"
		>
			<picture class="img-holder">
				<img
					:src="item.image"
					:alt="item.file?.name || `image-${ index }`"
					:data-index="index"
				>
			</picture>
			<i class="fa fa-times remove" @click="$event => detatch($event, index)"></i>
		</li>

		<li class="add" v-if="!max || files.length < max">
			<!-- Hidden input -->
			<input
				:multiple="multiple"
				:accept="mimeTypes.join(', ')"
				type="file"
				ref="file"
				@change="prepare"
			/>
			<i class="fa fa-plus"></i>
			<span>{{ $t('upload_image') }}</span>
		</li>
	</ul>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>