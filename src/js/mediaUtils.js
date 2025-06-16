import PhotoSwipeLightbox from "photoswipe/lightbox";
import VideoPlayer from "@/components/video-player/index.vue";
import Vue from 'vue';

function showMediaItems(mediaItems, startIndex) {
	const lightboxOptions = {
		initialZoomLevel: "fit",
		secondaryZoomLevel: 2,
		maxZoomLevel: 4,
		wheelToZoom: true,
		showHideAnimationType: "fade",
		pswpModule: () => import('photoswipe'),
	};

	const promises = (mediaItems || []).map(item => {
		let result = Promise.resolve();

		if (item.type === "image") {
			result = new Promise(resolve => {
				let image = new Image();
				const data = {
					image,
					mediaItem: item,
				};
				image.onload = () => resolve(data);
				image.onerror = () => resolve(data);
				image.src = item.url;
			});
		} else if (item.type === "video") {
			const data = {
				mediaItem: item,
			};
			result = Promise.resolve(data);
		};

		return result;
	});

	Promise.allSettled(promises).then(results => {
		lightboxOptions.dataSource = results
			.map(item => item.value)
			.filter(data => (data.mediaItem.type === "image" && data.image || data.mediaItem.type !== "image"))
			.map(data => {
				return data.mediaItem.type === "image" 
					? {
						src:    data.image.src,
						width:  data.image.width,
						height: data.image.height,
						mediaItem: data.mediaItem,
					}
					: {
						mediaItem: data.mediaItem,
					};
			});

		const lightbox = new PhotoSwipeLightbox(lightboxOptions);
		const videoContainerId = "pswp-video-container";

		lightbox.on('contentLoad', (event) => {
			const { content, isLazy } = event;

			const 
				mediaItem = content.data?.mediaItem,
				isVideo = (mediaItem?.type === "video");

			if (isVideo) {
				event.preventDefault();

				const videoContainer = document.createElement('div');
				videoContainer.className = 'pswp__video-container';
				videoContainer.id = videoContainerId;
		  
				var ComponentClass = Vue.extend(VideoPlayer);
				var playerInstance = new ComponentClass({
					propsData: {
						options: {},
					}
				});
				
				playerInstance.$mount();
				videoContainer.appendChild(playerInstance.$el);
				lightbox.playerInstance = playerInstance;
				const data = {
					playlistUrl: mediaItem?.data?.playlistUrl,
					thumbnailUrl: mediaItem?.data?.thumbnailUrl,
				};
				playerInstance.setSource(data);

				content.element = videoContainer;

				content.onLoaded();
			};
		});

		lightbox.on('contentActivate', ({ content }) => {
			// zoom button bug fix
			const
				data = content.data,
				zoomAllowed = (data?.mediaItem?.type === "image" && data?.width && data?.height),
				el = document.querySelector("div.pswp"),
				zoomClassName = "pswp--zoom-allowed";
			
			(zoomAllowed ? el?.classList.add(zoomClassName) : el?.classList.remove(zoomClassName));
		});

		lightbox.on('contentDeactivate', (event) => {
			const { content } = event;

			const 
				mediaItem = content.data?.mediaItem,
				isVideo = (mediaItem?.type === "video");
			
			if (isVideo) {
				lightbox.playerInstance?.pauseAsync();
			}
		});

		lightbox.on('pointerDown', (event) => {
			const 
				targetClassList = event.originalEvent?.target?.classList,
				controlClasses = [
					"vjs-mouse-display",
					"vjs-progress-control",
					"vjs-volume-control",
					"vjs-volume-horizontal",
					"vjs-volume-vertical",
					"vjs-control"
				],
				isControlClick = controlClasses.some(f => targetClassList?.contains(f));

			if (isControlClick) {
				event.preventDefault();
			};
		});

		lightbox.on('pointerUp', (event) => {
			if (event.originalEvent?.target?.id === videoContainerId) {
				lightbox.pswp?.close();
			};
		});

		lightbox.on('destroy', () => {
			lightbox.playerInstance?.$destroy();
			lightbox.playerInstance = null;
		});				

		lightbox.init();
		lightbox.loadAndOpen(startIndex);
	}).catch(e => {
		console.error(e);
	});   
}

export { showMediaItems }