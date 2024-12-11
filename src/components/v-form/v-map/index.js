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
		offers: {
			type: Array,
			default: () => []
		},
		mapMode: {
			type: String,
			default: "input"
		},
		zoom: {
			type: Number,
			default: 15
		},
		maxZoom: {
			type: Number,
			default: 18
		},
		mapActionData: {
			type: Object,
			default: () => ({})
		}
	},

	data() {
		this.provider = new OpenStreetMapProvider();

		return {
			offerIcon: this.imageUrl("offer.png"),
			offerIconActive: this.imageUrl("offer-active.png"),
			iconSize: [32, 37],
			mapObject: {},
			resizeObserver: null,
			geosearchOptions: {
				provider: this.provider,
				style: "bar",
				autoClose: true,
				searchLabel: this.$t("locationLabels.enter_address")
			},
			addressSearchEnabled: false,
			marker: (this.isInputMode ? this.center : null),
			scale: this.zoom,
			mapState: "",
			isLoading: false,
			offersSearchButton: false,
			offersLoadMoreButton: false,
			loadingError: false,
			loadingErrorMessage: "",
			foundOffers: [],
			cancelMoveEndHandler: null,
		}
	},

	computed: {
		/**
		 * Checking that the map mode is search
		 * 
		 * @returns {Boolean}
		 */
		isSearchMode() {
			return this.mapMode === "search";
		},

		/**
		 * Checking that the map mode is view
		 * 
		 * @returns {Boolean}
		 */
		isViewMode() {
			return this.mapMode === "view";
		},

		/**
		 * Checking that the map mode is input
		 * 
		 * @returns {Boolean}
		 */
		isInputMode() {
			return this.mapMode === "input";
		},

		/**
		 * Get offers to show
		 * 
		 * @returns {Array}
		 */
		shownOffers() {
			return this.isSearchMode ? this.foundOffers : this.offers;
		},

		/**
		 * Get icon anchor
		 * 
		 * @returns {Array}
		 */
		iconAnchor() {
			const
				dx = (this.iconSize?.[0] || 0) / 2,
				dy = (this.iconSize?.[1] || 0);

			return [dx, dy];
		},

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
		observeResize() {
			const map = this.$refs.map;
			this.resizeObserver = new ResizeObserver(() => {
				this.mapObject.invalidateSize();
			});
			this.resizeObserver.observe(map.$el);
		},

		toggleAddressSearch(event, options = { forcedValue: null }) {
			const
				parent = this.$refs.map.$el,
				el = parent.querySelector("div.leaflet-control-geosearch.bar form");

			if (el) {
				this.addressSearchEnabled = options?.forcedValue ?? !(this.addressSearchEnabled);
				el.style.visibility = this.addressSearchEnabled ? "visible" : "hidden" ;
			}
		},

		setupHandlers() {

			if (this.isViewMode) {
				this.setupViewModeHandlers();
			} else if(this.isInputMode) {
				this.setupInputModeHandlers();
			} else if (this.isSearchMode) {
				this.setupSearchModeHandlers();
			};

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
	
		},

		setupViewModeHandlers() {
			this.setToggleWheelByFocus();
		},

		setupInputModeHandlers() {
			this.setToggleWheelByFocus();

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

			const debouncedMoveEndHandler = this.debounce((e) => markerAtCenter(true, e), 300);
			this.cancelMoveEndHandler = debouncedMoveEndHandler.cancel;
	
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
					debouncedMoveEndHandler(e);
				});

			markerAtCenter(true);
		},

		setupSearchModeHandlers() {
			
			const moveEndHandler = (e) => {
				this.scale = this.mapObject.getZoom();
				const center = Object.values(
					this.mapObject.getCenter()
				);

				this.$emit("scale", this.scale, e);
				this.$emit("change", center, e);
			};

			this.mapObject.on("movestart", e => {
				this.$emit("mapAction", "moveMap");

				this.mapObject.off("moveend"); // prevent double moveend event bug
				this.mapObject.on("moveend", e => moveEndHandler(e));
			});

			moveEndHandler(null);
		},

		setToggleWheelByFocus() {
			this.toggleWheel(false);

			this.mapObject
				.on("focus", () => this.toggleWheel(true))
				.on("blur", () => this.toggleWheel(false));
		},

		setupData() {
			if (this.isSearchMode) {
				this.changeStateTo("initialState");
			}
		},

		changeStateTo(newState) {
			this.mapState = newState;

			if (this.isSearchMode) {

				this.isLoading = false;
				this.offersSearchButton = false;
				this.offersLoadMoreButton = false;
				this.loadingError = false;

				switch (this.mapState) {
					case "initialState":
						this.offersSearchButton = true;
						break;
						
					case "readyForSearch":
						this.offersSearchButton = true;
						break;

					case "isLoading":
						this.isLoading = true;
						break;
					
					case "fullyLoaded":
						break;

					case "partiallyLoaded":
						this.offersLoadMoreButton = true;
						break;

					case "loadingError":
						this.loadingError = true;
						break;
	
					default:
						break;
				}
			}
		},

		mapActionDataChanged() {
			if (this.isSearchMode) {

				const res = this.mapActionData;

				const
					loadingStarted = res.isLoading,
					mapMoved = !(res.isLoading || res.offers || res.error),
					loadingCompleted = !(res.isLoading) && res.offers,
					loadingFailed = !(res.isLoading) && res.error;
				
				switch (this.mapState) {

					case "initialState":
						if (loadingStarted) {
							this.changeStateTo("isLoading");
						}
						break;

					case "readyForSearch":

						if (loadingStarted) {
							this.changeStateTo("isLoading");
						} else if (loadingCompleted) {
							this.showLoadedOffers();
						}
						break;

					case "isLoading":

						if (mapMoved) {
							this.changeStateTo("readyForSearch");
						} else if (loadingCompleted) {
							this.showLoadedOffers();
							if (res.nextPageExists) {
								this.changeStateTo("partiallyLoaded");
							} else {
								this.changeStateTo("fullyLoaded");
							}
						} else if (loadingFailed) {
							this.loadingErrorMessage = res.error?.message;
							this.changeStateTo("loadingError");
						}
						break;
					
					case "fullyLoaded":

						if (mapMoved) {
							this.changeStateTo("readyForSearch");
						}
						break;

					case "partiallyLoaded":

						if (mapMoved) {
							this.changeStateTo("readyForSearch");
						} else if (loadingStarted) {
							this.changeStateTo("isLoading");
						}
						break;

					case "loadingError":

						if (mapMoved) {
							this.changeStateTo("readyForSearch");
						}						
						break;
	
					default:
						break;
				}

			}
		},

		showLoadedOffers() {
			if (this.isSearchMode) {
				const res = this.mapActionData;
				if (res.isNextPage) {
					this.foundOffers = this.foundOffers.concat(res.offers);
				} else {
					this.foundOffers = res.offers;
				}
			}
		},

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
		},

		searchOffersEvent(e) {
			this.$emit("mapAction", "loadData");
		},

		loadMoreOffersEvent(e) {
			this.$emit("mapAction", "loadNextPage");
		}
	},

	mounted() {
		this.$2watch("$refs.map").then(() => {
			this.mapObject = this.$refs.map.mapObject;
			this.observeResize();
			this.toggleAddressSearch(null, { forcedValue: this.isInputMode });
			this.setupHandlers();
			this.setupData();
		}).catch(e => { 
			console.error(e);
		});
	},

	watch: {
		mapActionData: {
			deep: true,
			handler() {
				this.mapActionDataChanged();
			}
		}
	},

	beforeDestroy() {
		this.mapObject.off();
		this.resizeObserver?.disconnect();
		this.cancelMoveEndHandler?.();
	},
}