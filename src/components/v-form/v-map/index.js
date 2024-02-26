import {
	LMap,
	LTileLayer,
	LMarker,
	LCircle,
	LCircleMarker,
	LControl
} from "vue2-leaflet";
import { Icon } from "leaflet";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import LGeosearch from "vue2-leaflet-geosearch";

delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
	iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
	iconUrl: require("leaflet/dist/images/marker-icon.png"),
	shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default {
	name: "Vmap",

	components: {
		LMap,
		LTileLayer,
		LMarker,
		LCircle,
		LCircleMarker,
		LControl,
		LGeosearch
	},

	props: {
		id: {
			type: String,
			default: `map-${ Math.random().toString(16).slice(2) }`
		},
		height: {
			type: String,
			default: "350px"
		},
		width: {
			type: String,
			default: "100%"
		},
		url: {
			type: String,
			default: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
		},
		attribution: {
			type: String,
			default: "&copy; <a target='_blank' href='http://osm.org/copyright'>OpenStreetMap</a> contributors"
		},
		center: {
			type: Array,
			default: () => [55.751244, 37.618423]
		},
		point: {
			type: Array,
			default: null
		},
		allowPosition: {
			type: Boolean,
			default: false
		},
		allowSelection: {
			type: Boolean,
			default: false
		},
		zoom: {
			type: Number,
			default: 15
		},
		radius: {
			type: Number,
			default: 1
		}
	},

	data() {
		this.provider = new OpenStreetMapProvider();

		return {
			mapObject: {},
			geosearchOptions: {
				provider: this.provider,
				style: "bar",
				autoClose: true,
				searchLabel: this.$t("locationLabels.enter_address")
			},
			marker: this.point,
			scale: this.zoom
		}
	},

	computed: {
		/**
		 * Get my location
		 * 
		 * @returns {Array|null}
		 */
		location: {
			cache: false,
			get() {
				return this.sdk.ifEmpty(this.sdk.location, undefined);
			}
		}
	},

	methods: {
		async setLocation() {
			const isGranted = await this.sdk.checkPermission("geolocation");

			if (!isGranted) {
				/* Request for permissons */
				await this.sdk.requestPermissions(["geolocation"]).then(() => {
					this.$forceUpdate();
				});
			}

			if (this.location?.length) {
				this.mapObject.panTo(this.location);
				this.$emit("change", this.location);
			}
		}
	},

	mounted() {
		this.mapObject = this.$refs.map.mapObject;
		const markerAtCenter = (emit, event) => {
			this.scale = this.mapObject.getZoom();
			this.marker = Object.values(
				this.mapObject.getCenter()
			);
			
			if (emit) {
				this.$emit("scale", this.scale, event);
				this.$emit("change", this.marker, event);
			}
		}

		if(this.allowSelection) {
			this.mapObject
				.on("click", e => {
					if (e.originalEvent.target.matches("div.vue2leaflet-map")) {
						this.marker = Object.values(e.latlng);
						this.$emit("change", Object.values(e.latlng));
					}
				})
				.on("move", e => {
					if (e?.originalEvent) markerAtCenter(false, e);
				})
				.on("moveend", e => {
					this.debounce(() => markerAtCenter(true, e), 1000)();
				});

			markerAtCenter(true);
		}
	}
}