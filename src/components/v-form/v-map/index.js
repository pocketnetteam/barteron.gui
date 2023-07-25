import {
	LMap,
	LTileLayer,
	LMarker
} from "vue2-leaflet";
import { Icon } from "leaflet";

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
		LMarker
	},

	props: {
		id: {
			type: String,
			default: `map-${ (+new Date).toString(16) }`
		},
		height: {
			type: String,
			default: "260px"
		},
		width: {
			type: String,
			default: "100%"
		},
	},

	data() {
		return {
			url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
			attribution: "&copy; <a target='_blank' href='http://osm.org/copyright'>OpenStreetMap</a> contributors",
			zoom: 15,
			center: [51.505, -0.159],
			markerLatLng: [51.504, -0.159]
		}
	},

	created() {
		
	},

	mounted() {
		
	}
}