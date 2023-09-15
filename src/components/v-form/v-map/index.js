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
			default: "260px"
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
		}
	},

	data() {
		this.provider = new OpenStreetMapProvider();

		return {
			mapObject: {},
			geosearchOptions: {
				provider: this.provider
			},
			marker: null
		}
	},

	computed: {
		/**
		 * Get my location
		 * 
		 * @return {Array}
		 */
		location() {
			const location = Object.values(this.sdk.location);
			return location.length ? location : undefined;
		}
	},

	methods: {
		setLocation() {
			this.mapObject.panTo(this.location);
		}
	},

	mounted() {
		this.mapObject = this.$refs.map.mapObject;
		
		if(this.allowSelection) {
			this.mapObject.on("click", (e) => {
				if (e.originalEvent.target.matches("div.vue2leaflet-map")) {
					this.marker = Object.values(e.latlng);
				}
			});
		}
	}
}