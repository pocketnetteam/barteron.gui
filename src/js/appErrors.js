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
		const 
			imagesMaxCountExceeded = (/images:max:\d+$/.test(message)), // example "images:max:10"
			imagesFailedUploadNumbers = (/images:failedUploadNumbers:.+$/.test(message)); // example "images:failedUploadNumbers:2,3,5"

		if (imagesMaxCountExceeded) {
			message = VueI18n.t("dialogLabels.images_max_count_exceeded_error");
		} else if (imagesFailedUploadNumbers) {
			const 
				rawNumbers = message.split(":").pop(),
				numbers = rawNumbers.split(",").join(", ");

			message = VueI18n.t("dialogLabels.images_failed_upload_numbers_error", {numbers});
		}
		super(message);
		this.error = error;
	}
}

class PaymentError extends Error {
	constructor(error) {
		let message = VueI18n.t("dialogLabels.payment_error");
		const 
			canceled = (error === "cancel"),
			forbidden = (error === "forbid"),
			knownErrors = {
				"actions_totalAmountSmaller_amount": "total_amount_smaller_amount_error",
				"actions_totalAmountSmaller_amount_wait": "total_amount_smaller_amount_wait_error",
				"actions_totalAmountSmaller_amount_fee": "total_amount_smaller_amount_fee_error",
				"actions_totalAmountSmaller_amount_fee_wait": "total_amount_smaller_amount_fee_wait_error",
			};

		if (canceled) {
			message = VueI18n.t("dialogLabels.transfer_canceled");
		} else if (forbidden) {
			message = VueI18n.t("dialogLabels.transfer_forbidden");
		} else if (error?.message && knownErrors[error?.message]) {
			const key = knownErrors[error?.message];
			message = VueI18n.t(`dialogLabels.${key}`);
		} else {
			message += (error?.message ? `: ${error.message}` : "");
		};
		super(message);
		this.error = error;
		this.canceled = canceled;
		this.forbidden = forbidden;
	}
}

export default { 
	RequestIdError, 
	AppGeolocationPermissionError, 
	GeolocationRequestError,
	UploadImagesError,
	PaymentError,
}