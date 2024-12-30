import VueI18n from "@/i18n/index.js";

class RequestIdError extends Error {
	constructor(requestName, id, currentId) {
		const message = `Request "${requestName}" rejected by id = ${id}, current id = ${currentId}`;
		super(message);
		this.name = this.constructor.name;
		this.requestName = requestName;
		this.id = id;
		this.currentId = currentId;
	}
}

class AppGeolocationPermissionError extends Error {
	constructor(error) {
		const message = VueI18n.t("dialogLabels.app_geolocation_permission_error");
		super(message);
		this.error = error;
	}
}

class GeolocationRequestError extends Error {
	constructor(error) {
		let message = error.message;
		if (message === "location:notavailable") {
			message =  VueI18n.t("dialogLabels.platform_geolocation_permission_error");
		}
		super(message);
		this.error = error;
	}
}

class UploadImagesError extends Error {
	constructor(error) {
		let message = error.message;
		const imagesMaxCountExceeded = (/images:max:\d+$/.test(message)); // example "images:max:10"
		if (imagesMaxCountExceeded) {
			message =  VueI18n.t("dialogLabels.images_max_count_exceeded_error");
		}
		super(message);
		this.error = error;
	}
}

export default { 
	RequestIdError, 
	AppGeolocationPermissionError, 
	GeolocationRequestError,
	UploadImagesError
}