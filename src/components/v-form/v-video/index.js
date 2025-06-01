import VideoPlayer from "@/components/video-player/index.vue";

export default {
	name: "Vvideo",

	components: {
		VideoPlayer,
	},

	props: {
		url: {
			type: String,
			default: null
		},
	},

	data() {
		return {
			state: "readyToUpload",
			currentUrl: this.url,
			error: null,
			videoInfo: null,
			processingCheckInterval: null,
			videoExists: false,
			newVideoAdded: false,
		}
	},

	inject: ["dialog"],
	
	methods: {
		changeStateTo(newState) {
			this.state = newState;

			switch (this.state) {
				case "readyToUpload":

					this.currentUrl = null;
					this.videoInfo = null;
					this.error = null;
					this.videoExists = false;
					break;
			
				case "processingOfUploadedVideo":
					this.videoExists = true;
					this.newVideoAdded = true;
					this.$emit("newVideoAdded", this);
					this.waitForVideoProcessing();
					break;

				case "videoProcessingFailed":
					this.videoExists = true;
					break;
						
				case "videoUploaded":
					this.videoExists = true;
					this.updateSourceAsync();
					break;
					
				case "errorState":
					this.videoExists = false;
					break;
			
				default:
					break;
			};

		},

		uploadingVideoDialog() {
			this.sdk.uploadingVideoDialog().then(result => {
				this.currentUrl = result?.link;
				if (this.currentUrl) {
					this.sdk.getVideoInfo([this.currentUrl], true).then(items => {
						this.videoInfo = items?.[0];
						this.changeStateTo("processingOfUploadedVideo");
					}).catch(e => { 
						this.error = e;
						this.changeStateTo("errorState");
					});
				}
			});
		},

		waitForVideoProcessing() {
			this.processingCheckInterval = setInterval(() => {
				this.sdk.getVideoInfo([this.currentUrl], true).then(items => {
					this.videoInfo = items?.[0];

					const 
						stateId = this.videoInfo?.state?.id,
						isPublished = (stateId === 1),
						isTranscoding = (stateId === 2 || stateId === 3),
						isFailed = (stateId === 7);

					if (isPublished) {
						this.stopVideoProcessingChecking();
						this.changeStateTo("videoUploaded");

					} else if (isTranscoding) {

					} else if (isFailed) {
						this.stopVideoProcessingChecking();
						this.changeStateTo("videoProcessingFailed");
					};
				}).catch(e => { 
					this.stopVideoProcessingChecking();
					this.error = e;
					this.changeStateTo("errorState");
				});
			}, 20_000);
		},

		stopVideoProcessingChecking() {
			if (this.processingCheckInterval) {
				clearInterval(this.processingCheckInterval);
				this.processingCheckInterval = null;
			};
		},

		updateSourceAsync() {
			this.$2watch("$refs.videoPlayer").then(() => {
				return this.loadVideoInfo();
			}).then(() => {
				const data = {
					playlistUrl: this.videoInfo?.playlistUrl,
					thumbnailUrl: this.videoInfo?.thumbnailUrl,
				};
				this.$refs.videoPlayer?.setSource(data);
			}).catch(e => { 
				this.error = e;
				this.changeStateTo("errorState");
			});
		},

		loadVideoInfo() {
			return new Promise(resolve => {
				if (this.currentUrl && !(this.videoInfo)) {
					return this.sdk.getVideoInfo([this.currentUrl]).then(items => {
						this.videoInfo = items?.[0];
						resolve();
					});
				} else {
					resolve();
				};
			});
		},

		removeVideoEvent() {
			const dialog = this.dialog?.instance;
			dialog.view("question", {
				text: this.$t("dialogLabels.video_delete"),
				buttons: [
					{ text: this.$t("buttonLabels.no"), vType: "blue", vSize: "sm", click: () => dialog.hide(false) },
					{ text: this.$t("buttonLabels.yes"), vType: "dodoria", vSize: "sm", click: () => dialog.hide(true) }
				]
			}).then(state => {
				if (state) {
					this.removeVideo();
				};
			});
		},

		removeVideo() {
			this.videoRemoving().catch(e => {
				this.error = e;
				this.changeStateTo("errorState");
			});
		},

		videoRemoving(options = {disableStateChange: false}) {
			return Promise.resolve().then(() => {
				this.stopVideoProcessingChecking();
				this.$refs.videoPlayer?.pauseAsync();
				const needRemoveFile = this.newVideoAdded;
				if (needRemoveFile) {
					return this.sdk.removeVideo(this.currentUrl);
				};
			}).then(() => {
				if (!(options?.disableStateChange)) {
					this.changeStateTo("readyToUpload");
				};
			})
		},

		repeatLoading() {
			this.changeStateTo("readyToUpload");
		},

		canSerialize() {
			let result = {
				canSerialize: true,
			};

			const serializationStates = [
				"readyToUpload",
				"videoUploaded",
				"errorState",
			];

			if (!(serializationStates.includes(this.state))) {
				let i18nVideosKey = "finish_working_with_video";

				if (this.state === "processingOfUploadedVideo") {
					i18nVideosKey = "wait_until_video_processed";
				} else if (this.state === "videoProcessingFailed") {
					i18nVideosKey = "video_processing_failed";
				};

				result = {
					canSerialize: false,
					message: this.$t(`videosLabels.${i18nVideosKey}`),
				};
			}

			return result;
		},

		getData() {
			return {
				url: (this.state === "videoUploaded" ? this.currentUrl : null),
				videoExists: this.videoExists,
			};
		},
	},

	mounted() {
		if (this.currentUrl) {
			this.loadVideoInfo().then(() => {
				if (this.videoInfo.playlistUrl) {
					this.changeStateTo("videoUploaded");
				} else {
					this.changeStateTo("readyToUpload");
				};
			})
		} else {
			this.changeStateTo("readyToUpload");
		};		
	},
}