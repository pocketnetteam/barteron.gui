<template>
	<div class="video-uploader">

		<div class="video-query">

			<!-- State: readyToUpload -->
			<div 
				v-if="state === 'readyToUpload'"
				class="ready-to-upload"
				@click="uploadingVideoDialog"
			>
				<i class="fa fa-plus"></i>
				<span>{{ $t('videosLabels.upload_video') }}</span>
			</div>

			<!-- State: processingOfUploadedVideo -->
			<div 
				v-if="state === 'processingOfUploadedVideo'"
				class="processing-of-uploaded-video"
			>
				<picture>
					<img :src="videoInfo?.thumbnailUrl" :alt="videoInfo?.name || 'thumbnail'">
				</picture>

				<div class="processing-status-holder">
					<div class="processing-status">
						<i class="fa fa-spinner fa-spin"></i>
						{{ $t('videosLabels.video_is_being_processed') }}
					</div>
				</div>

				<i 
					class="fa fa-times remove" 
					@click="removeVideoEvent"
				></i>
			</div>

			<!-- State: videoProcessingFailed -->
			<div 
				v-if="state === 'videoProcessingFailed'"
				class="video-processing-failed"
			>
				<picture>
					<img :src="videoInfo?.thumbnailUrl" :alt="videoInfo?.name || 'thumbnail'">
				</picture>

				<div class="processing-status-holder">
					<div class="processing-status">
						<i class="fa fa-exclamation-triangle"></i>
						{{ $t('videosLabels.video_processing_failed') }}
					</div>
				</div>

				<i 
					class="fa fa-times remove" 
					@click="removeVideo"
				></i>
			</div>

			<!-- State: videoUploaded -->
			<div 
				v-if="state === 'videoUploaded'"
				class="video-uploaded"
			>
				<VideoPlayer 
					ref="videoPlayer"
					:options="{}"
				/>
				<i 
					class="fa fa-times remove" 
					@click="removeVideoEvent"
				></i>
			</div>

			<!-- State: errorState -->
			<div 
				v-if="state === 'errorState'"
				class="error-state"
			>
				<div class="error-info">
					<p>{{ error?.message || error?.text }}</p>
					<v-button
						@click="repeatLoading"
					>{{ $t('buttonLabels.repeat') }}</v-button>
				</div>
			</div>
		</div>

		<!-- <span
			class="status"
			v-if="files.length"
		>{{
			$tc('photosLabels.status', files.length || 0, {
				count: files.length,
				size: filesSizeCalculated
					? formatBytes(files.reduce((i, f) => i + (f.fileSize || 0), 0))
					: $t('photosLabels.size_is_calculated').toLowerCase()
			})
		}}</span> -->
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>