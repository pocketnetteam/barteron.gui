import PhotoSwipeLightbox from "photoswipe/lightbox";
import VideoPlayer from "@/components/video-player/index.vue";
import SDK from "@/js/sdk.js";
import i18n from "@/i18n/index.js";
import Vue from "vue";

function showMediaItems(mediaItems, startIndex) {
	const dataSource = (mediaItems || []).map(item => {
		let result = null;
		if (item.type === "image") {
			result = {
				src: item.url,
				width: item.width || 1200, 
				height: item.height || 800,
				mediaItem: item,
			};
		} else if (item.type === "video") {
			result = {
				mediaItem: {
					...item
				},
			};
		};
		return result;
	}).filter(f => f);

	const lightboxOptions = {
		dataSource: dataSource,
		initialZoomLevel: "fit",
		secondaryZoomLevel: 2,
		maxZoomLevel: 4,
		wheelToZoom: true,
		showHideAnimationType: "fade",
		pswpModule: () => import("photoswipe"),
	};

	const lightbox = new PhotoSwipeLightbox(lightboxOptions);
	const videoContainerId = "pswp-video-container";

	lightbox.on("gettingData", (e) => {
		const { data } = e;
		if (data.mediaItem?.type === "image" && (!data.width || data.width === 1200)) {
			const img = new Image();
			img.src = data.src;
			img.onload = () => {
				data.width = img.width;
				data.height = img.height;
				lightbox.pswp?.refreshSlideContent(e.index);
			};
		}
	});

	lightbox.on("contentLoad", async (event) => {
		const { content } = event;
		const mediaItem = content.data?.mediaItem;

		if (mediaItem?.type === "video") {
			event.preventDefault();
			content.state = "loading";

			const videoContainer = document.createElement("div");
			videoContainer.className = "pswp__video-container";
			videoContainer.id = videoContainerId;
			content.element = videoContainer;

			const needVideoInfo = !(mediaItem.data?.playlistUrl);
			if (needVideoInfo) {
				try {
					const sdk = new SDK();
					const dataItems = await sdk.getVideoInfo([mediaItem.url]);
					const videoItem = dataItems?.[0];
					if (videoItem) {
						mediaItem.data = videoItem;
					} else {
						throw new Error(i18n.t("videosLabels.video_not_found_or_removed"));
					};
				} catch (e) {
					mediaItem.error = e;
					console.error(e);
				};
			};

			if (mediaItem.data) {

				const ComponentClass = Vue.extend(VideoPlayer);
				const playerInstance = new ComponentClass({
					propsData: { options: {} }
				});

				playerInstance.$mount();
				videoContainer.appendChild(playerInstance.$el);
				lightbox.playerInstance = playerInstance;

				playerInstance.setSource({
					playlistUrl: mediaItem?.data?.playlistUrl,
					thumbnailUrl: mediaItem?.data?.thumbnailUrl,
				});

			} else if (mediaItem.error) {

				const errorMsg = document.createElement("div");
				errorMsg.className = "pswp__error-msg";
				errorMsg.innerHTML = `
					<div style="text-align: center; margin: 20px auto; color: #ccc;">
						<p>${i18n.t("videosLabels.video_loading_failed")}</p>
						<small>${mediaItem.error.message}</small>
					</div>
				`;
				videoContainer.appendChild(errorMsg);

			}

			content.onLoaded();
		}
	});

	lightbox.on("contentActivate", ({ content }) => {
		const data = content.data;
		const zoomAllowed = data?.mediaItem?.type === "image";
		const el = document.querySelector("div.pswp");
		el?.classList.toggle("pswp--zoom-allowed", !!zoomAllowed);
	});

	lightbox.on("contentDeactivate", ({ content }) => {
		if (content.data?.mediaItem?.type === "video") {
			lightbox.playerInstance?.pauseAsync();
		}
	});

	lightbox.on("pointerDown", (event) => {
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

	lightbox.on("pointerUp", (event) => {
		if (event.originalEvent?.target?.id === videoContainerId) {
			lightbox.pswp?.close();
		}
	});

	lightbox.on("destroy", () => {
		lightbox.playerInstance?.$destroy();
		lightbox.playerInstance = null;
	});

	lightbox.init();
	lightbox.loadAndOpen(startIndex);

	return lightbox;
}

export { showMediaItems };