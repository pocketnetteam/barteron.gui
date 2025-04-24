import Vue from "vue";
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
import PickupPointItem from "@/components/pickup-point/item/index.vue";
import { mapState } from "pinia";
import { useLocaleStore } from "@/stores/locale.js";
import ThemeStore from "@/stores/theme.js";

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
		BarterItem,
		PickupPointItem
	},

	props: {
		id: {
			type: String,
			default: `map-${ Math.random().toString(16).slice(2) }`
		},
		height: {
			type: String,
			default: "400px"
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
			default: () => [0, 0]
		},
		offers: {
			type: Array,
			default: () => []
		},
		selectedOfferIds: {
			type: Array,
			default: () => []
		},
		mapMode: {
			type: String,
			default: "input"
		},
		pickupPointPopupMode: {
			type: String,
			default: "readonly"
		},
		zoom: {
			type: Number,
			default: 10
		},
		maxZoom: {
			type: Number,
			default: 18
		},
		mapActionData: {
			type: Object,
			default: () => ({})
		},
	},

	data() {
		return {
			offerIcon: {
				regular: this.imageUrl("offer.png"),
				active: this.imageUrl("offer-active.png"),
				size: [32, 37],
				anchor: [16, 37],
			},
			pickupPointIcon: {
				regular: this.imageUrl("pickup-point.png"),
				active: this.imageUrl("pickup-point-active.png"),
				size: [32, 37],
				anchor: [16, 37],
			},
			selfPickupIcon: {
				regular: this.imageUrl("self-pickup-icon.png"),
				active: this.imageUrl("self-pickup-icon-active.png"),
				size: [32, 37],
				anchor: [16, 37],
			},
			mapObject: {},
			mapHandlers: {},
			resizeObserver: null,
			geosearchOptions: this.getGeosearchOptions(),
			addressSearchEnabled: false,
			marker: null,
			scale: this.zoom,
			userLocationIsLoading: false,
			mapState: "",
			isLoading: false,
			offersSearchButton: false,
			offersLoadMoreButton: false,
			loadingError: false,
			loadingErrorMessage: "",
			foundOffers: [],
			geosearchForm: null,
			mountingComplete: false,
		}
	},

	computed: {
		...mapState(useLocaleStore, ["locale"]),

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
		 * Checking that the map mode is delivery selection
		 * 
		 * @returns {Boolean}
		 */
		isDeliverySelectionMode() {
			return this.mapMode === "deliverySelection";
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
		 * Checking that the map mode is delivery input
		 * 
		 * @returns {Boolean}
		 */
		isDeliveryInputMode() {
			return this.mapMode === "deliveryInput";
		},

		/**
		 * Get offers to show
		 * 
		 * @returns {Array}
		 */
		shownOffers() {
			return (this.isSearchMode || this.isDeliveryInputMode) ? this.foundOffers : this.offers;
		},

		isDarkTheme() {
			return ThemeStore.isDarkTheme();
		},
	},

	methods: {
		getOfferIcon(offer) {
			let icon = {};
			if (offer.isPickupPoint) {
				icon = this.pickupPointIcon;
			} else if (offer.isSelfPickup) {
				icon = this.selfPickupIcon;
			} else {
				icon = this.offerIcon;
			}

			const key = (
					this.isViewMode 
					|| this.isSelectedOffer(offer)
					|| this.isDeliverySelectionMode && !(offer.isPickupPoint || offer.isSelfPickup)
				) ? "active" : "regular",
				url = icon[key];

			return {
				...icon,
				url,
			};
		},

		getGeosearchOptions() {
			return {
				provider: this.getMapProvider(),
				style: "bar",
				autoClose: true,
				searchLabel: this.$t("locationLabels.enter_address"),
				notFoundMessage: this.$t("locationLabels.address_not_found"),
			};
		},

		getMapProvider() {
			return new OpenStreetMapProvider({
				params: {
				  'accept-language': this.sdk.getLanguageByLocale(this.$root.$i18n.locale),
				  addressdetails: 1,
				},
			});
		},

		localeChanged() {
			Vue.set(this, "geosearchOptions", this.getGeosearchOptions());
		},

		observeResize() {
			const map = this.$refs.map;
			this.resizeObserver = new ResizeObserver(() => {
				this.mapObject.invalidateSize();
			});
			this.resizeObserver.observe(map.$el);
		},

		setupMapMode() {
			const needShowAddressInput = (this.isSearchMode || this.isInputMode || this.isDeliveryInputMode);
			this.toggleAddressSearch(null, {forcedValue: needShowAddressInput});
			this.setupHandlers();
			this.setupData();
		},

		toggleAddressSearch(event, options = { forcedValue: null }) {
			const el = this.getGeosearchForm();
			if (el) {
				this.addressSearchEnabled = options?.forcedValue ?? !(this.addressSearchEnabled);
				el.style.visibility = this.addressSearchEnabled ? "visible" : "hidden";
			}
			event?.currentTarget?.blur();
		},

		getGeosearchForm() {
			if (!(this.geosearchForm)) {
				const parent = this.$refs.map.$el;
				this.geosearchForm = parent.querySelector("div.leaflet-control-geosearch.bar form");
			}
			return this.geosearchForm;
		},

		setupHandlers() {

			this.resetAllCustomHandlers();

			if (this.isViewMode) {
				this.setupViewModeHandlers();
			} else if (this.isDeliverySelectionMode) {
				this.setupDeliverySelectionModeHandlers();
			} else if(this.isInputMode) {
				this.setupInputModeHandlers();
			} else if(this.isDeliveryInputMode) {
				this.setupDeliveryInputModeHandlers();
			} else if (this.isSearchMode) {
				this.setupSearchModeHandlers();
			};

			// legacy
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

		resetAllCustomHandlers() {
			this.toggleWheel(true);

			Object.entries(this.mapHandlers).forEach(([key, value]) => {
				this.mapObject.off(key, value);
			});
		},

		setupViewModeHandlers() {
			this.setToggleWheelByFocus();
		},

		setupDeliverySelectionModeHandlers() {
			this.setupViewModeHandlers();
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

			const handlers = this.mapHandlers;

			handlers.click = (e) => {
				if (e.originalEvent.target.matches("div.vue2leaflet-map")) {
					this.marker = Object.values(e.latlng);
					this.$emit("change", Object.values(e.latlng));
				}
			};

			handlers.move = (e) => {
				if (e?.originalEvent) markerAtCenter(false, e);
			};

			handlers.moveend = (e) => {
				markerAtCenter(true, e);
			};

			this.mapObject
				.on("click", handlers.click)
				.on("move", handlers.move)
				.on("moveend", handlers.moveend);

			markerAtCenter(true);
		},

		setupDeliveryInputModeHandlers() {
			this.setupSearchModeHandlers();
		},

		setupSearchModeHandlers() {
			const handlers = this.mapHandlers;

			const moveEndHandler = (e) => {
				this.mapObject.off("moveend", handlers.moveend); // prevent double moveend event bug

				this.scale = this.mapObject.getZoom();
				const center = Object.values(
					this.mapObject.getCenter()
				);

				this.$emit("scale", this.scale, e);
				this.$emit("change", center, e);
				this.$emit("bounds", this.mapObject.getBounds(), e);
			};

			handlers.moveend = (e) => moveEndHandler(e);

			handlers.movestart = (e) => {
				this.$emit("mapAction", "moveMap", {}, e);
				this.mapObject.on("moveend", handlers.moveend);
			};

			handlers["geosearch/showlocation"] = (e) => {
				this.$emit("geosearch_showlocation", e);
			};

			handlers.popupopen = (e) => {
				this.toggleAddressSearch(null, {forcedValue: false});
			};
			
			this.mapObject
				.on("movestart", handlers.movestart)
				.on("geosearch/showlocation", handlers["geosearch/showlocation"])
				.on("popupopen", handlers.popupopen);
		},

		setToggleWheelByFocus() {
			this.toggleWheel(false);

			const handlers = this.mapHandlers;

			handlers.focus = () => this.toggleWheel(true);
			handlers.blur = () => this.toggleWheel(false);

			this.mapObject
				.on("focus", handlers.focus)
				.on("blur", handlers.blur);
		},

		setupData() {
			if (this.isInputMode || this.isDeliveryInputMode) {
				this.marker = this.marker ?? Object.values(this.mapObject.getCenter());
				if (this.isDeliveryInputMode) {
					this.changeStateTo("initialState");
				}
			} else if (this.isSearchMode) {
				this.marker = null;
				this.changeStateTo("initialState");
			}
		},

		changeStateTo(newState) {
			this.mapState = newState;

			if (this.isSearchMode || this.isDeliveryInputMode) {

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
			if (this.isSearchMode || this.isDeliveryInputMode) {

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
			if (this.isSearchMode || this.isDeliveryInputMode) {
				const res = this.mapActionData;
				if (res.isNextPage) {
					this.foundOffers = this.foundOffers.concat(res.offers);
				} else {
					this.foundOffers = res.offers;
				}
			}
		},

		showPickupPoint() {
			this.mapObject.closePopup();
		},

		selectPickupPoint(offer) {
			this.mapObject.closePopup();
			setTimeout(() => {
				this.$emit("selectPickupPoint", offer, {source: "map"});
			}, 300);
		},

		unselectPickupPoint(offer) {
			this.mapObject.closePopup();
			setTimeout(() => {
				this.$emit("unselectPickupPoint", offer, {source: "map"});
			}, 300);
		},

		buyAtPickupPoint(offer) {
			this.mapObject.closePopup();
			setTimeout(() => {
				this.$emit("buyAtPickupPoint", offer, {source: "map"});
			}, 300);
		},

		isSelectedOffer(offer) {
			return this.selectedOfferIds.some(f => f === offer.hash);
		},

		moveToGeohash(geohash) {
			this.mapObject.setView(
				this.decodeGeoHash(geohash),
				this.scale || 0
			);
		},

		startLocating() {
			if (this.userLocationIsLoading) {
				return;
			}

			this.userLocationIsLoading = true;
			this.sdk.requestUserLocation(true, true).then(result => {
				if (this.latLonDefined(result)) {
					this.scale = this.mapObject.getZoom();
					const minZoom = 12;
					this.mapObject.setView(
						result, 
						Math.max(this.scale, minZoom)
					);
					if (this.isViewMode || this.isDeliverySelectionMode) {
						this.marker = result;
					}
				} else {
					throw new Error('Location data is not defined');
				}
			}).catch(e => {
				console.error(e);
				this.$emit("errorEvent", e);
			}).finally(() => {
				this.userLocationIsLoading = false;
			});
		},

		toggleWheel(enable) {
			this.mapObject.scrollWheelZoom[enable ? "enable" : "disable"]()
		},

		searchOffersEvent(e) {
			this.mapObject.closePopup();
			this.emitLoadingMapAction("loadData", e);
		},

		loadMoreOffersEvent(e) {
			this.mapObject.closePopup();
			this.emitLoadingMapAction("loadNextPage", e);
		},

		emitLoadingMapAction(actionName, e) {
			const actionParams = {
				bounds: this.mapObject.getBounds(),
			}
			this.$emit("mapAction", actionName, actionParams, e);
		},

		latLonDefined(latLon) {
			return latLon?.length && (latLon[0] || latLon[1]);
		},
	},

	mounted() {
		this.mountingComplete = false;

		this.$2watch("$refs.map").then(map => {
			this.mapObject = map.mapObject;
			this.observeResize();
		}).then(() => {
			return this.latLonDefined(this.center) ? 
				this.center 
				: this.sdk.getDefaultLocation();
		}).catch(e => { 
			console.error(e);
		}).then(latLon => {
			const center = this.latLonDefined(latLon) ? latLon : [0, 0];
			const zoom = this.latLonDefined(latLon) ? this.zoom : 0;
			this.mapObject.setView(center, zoom);
		}).then(() => {
			this.setupMapMode();
		}).catch(e => { 
			console.error(e);
		}).finally(() => {
			this.mountingComplete = true;
		});
	},

	watch: {
		mapMode() {
			this.$2watch("mountingComplete").then(() => {
				this.setupMapMode();
			});
		},

		locale() {
			this.localeChanged();
		},

		mapActionData: {
			deep: true,
			handler() {
				this.mapActionDataChanged();
			}
		}
	},

	beforeDestroy() {
		this.mapObject.off?.();
		this.resizeObserver?.disconnect();
	},
}