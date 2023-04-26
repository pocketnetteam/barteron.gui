export default {
	name: "Vmap",

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
			script: null,
			map: null
		}
	},

	created() {
		this.script = document.createElement("script");
		this.script.type = "text/javascript";
		this.script.src = "https://maps.api.2gis.ru/2.0/loader.js?pkg=full";
		document.head.append(this.script);
	},

	mounted() {
		this.$refs.map.style.setProperty('--height', this.height);
		this.$refs.map.style.setProperty('--width', this.width);

		this.script.onload = () => {
			DG.then(() => {
					this.map = DG.map(this.id, {
							center: [54.98, 82.89],
							zoom: 13
					});
			});
		}
	}
}