import videojs from "video.js";
import "videojs-hls-quality-selector";

export default {

	name: 'VideoPlayer',

	props: {
		options: {
			type: Object,
			default: () => ({})
		}
	},

	data() {
		return {
			player: null,
		}
	},

	computed: {
		defaultOptions() {
			return {
				autoplay: false,
				controls: true,
				disablePictureInPicture: true,
				enableDocumentPictureInPicture: false,
				controlBar: {
					fullscreenToggle: false,
					pictureInPictureToggle: false,
				},
				userActions: {
					doubleClick: false,
					hotkeys: false,
				},
			};
		},
	},

	methods: {
		initPlayer() {
			this.$2watch("$refs.videoPlayer").then(() => {
				const customOptions = {...this.defaultOptions, ...this.options};
				this.player = videojs(this.$refs.videoPlayer, customOptions, () => {
					this.player.hlsQualitySelector({
						displayCurrentQuality: true,
					});
					// this.player.log('onPlayerReady', this);
				});
			}).catch(e => { 
				console.error(e);
			});
		},

		setSource(data) {
			if (this.player) {
				this._applySourceData(data);
			} else {
				this.$2watch("player").then(() => {
					this._applySourceData(data);
				}).catch(e => { 
					this.error = e;
				});
			};
		},

		_applySourceData(data) {
			const player = this.player;
			player?.ready(() => {
				if (data.playlistUrl) {
					player.src([{ src: data.playlistUrl }]);
					if (data.thumbnailUrl) {
						player.poster(data.thumbnailUrl);
					};
				} else {
					player.src();
					player.poster();
				};
			});
		},

		pauseAsync() {
			const player = this.player;
			player?.ready(() => {
				if (!(player.paused())) {
					player.pause();
				};
			});
		},
	},

	mounted() {
		this.initPlayer();
	},

	beforeDestroy() {
		this.player?.dispose();
	}
}