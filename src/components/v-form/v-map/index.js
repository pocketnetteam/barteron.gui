import { Icon } from "leaflet";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import {
	LMap,
	LTileLayer,
	LMarker,
	LTooltip,
	LPopup,
	LCircle,
	LCircleMarker,
	LControl,
	LIcon
} from "vue2-leaflet";
import Vue2LeafletMarkerCluster from "vue2-leaflet-markercluster";
import LGeosearch from "vue2-leaflet-geosearch";
import BarterItem from "@/components/barter/item/index.vue";

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
		LMarkerCluster: Vue2LeafletMarkerCluster,
		LTooltip,
		LPopup,
		LCircle,
		LCircleMarker,
		LControl,
		LIcon,
		LGeosearch,
		BarterItem
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
		offers: {
			type: Array,
			default: () => []
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
		maxZoom: {
			type: Number,
			default: 18
		},
		radius: {
			type: Number,
			default: 1
		}
	},

	data() {
		this.provider = new OpenStreetMapProvider();

		return {
			offerIcon: this.imageUrl("offer.png"),
			offerIconActive: this.imageUrl("offer-active.png"),
			iconSize: [32, 37],
			offersNear: [],
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
				}).catch(e => { 
					console.error(e);
				});
			}

			if (this.location?.length) {
				this.mapObject.panTo(this.location);
				this.$emit("change", this.location);
			}
		},

		toggleWheel(enable) {
			this.mapObject.scrollWheelZoom[enable ? "enable" : "disable"]()
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

		/* this.mapObject
			.on("mousemove", e => {
				this.lastMousePos = e.originalEvent;
			})
			.on("zoom", () => {
				if (this.lastMousePos) {
					const latLng = this.mapObject.mouseEventToLatLng(this.lastMousePos);
					this.mapObject.setView(latLng, this.mapObject.getZoom());
				}
				console.log(this.mapObject)
			}); */

		if(this.allowSelection) {
			const debouncedMoveEndHandler = this.debounce((e) => markerAtCenter(true, e), 1000);
			this.cancelMoveEndHandler = debouncedMoveEndHandler.cancel;
	
			this.mapObject
				.on("focus", () => this.toggleWheel(true))
				.on("blur", () => this.toggleWheel(false))
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
					debouncedMoveEndHandler(e);
				});

			markerAtCenter(true);
		}
	},

	beforeDestroy() {
		this.cancelMoveEndHandler?.()
	},
}