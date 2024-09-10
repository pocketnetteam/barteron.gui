<template>
	<div :class="{
	'photo-uploader': true,
	'no-files': !files.length,
	'dragover': drag
	}">
		<ul
			class="photo-query"
			@paste="clipboard"
			@drop="drop"
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
				<span>{{ $t('photosLabels.upload_image') }}</span>
			</li>
		</ul>

		<transition-group
			name="list"
			tag="ul"
			class="log"
		>
			<li
				v-for="(item, i) in log"
				:key="i"
				:class="`log item-${ item.type }`"
			>{{ item.text }}</li>
		</transition-group>

		<span
			class="status"
			v-if="files.length"
		>{{
			$tc('photosLabels.status', files.length || 0, {
				count: files.length,
				size: filesSizeCalculated
					? formatBytes(files.reduce((i, f) => i + (f.fileSize || 0), 0))
					: $t('photosLabels.size_is_calculated').toLowerCase()
			})
		}}</span>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>