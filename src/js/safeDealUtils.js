import SDK from "@/js/sdk.js";

class IdHelper{
	constructor() {
		this.sdk = new SDK();
	}

	get params() {
		return {
			currentIdVersion: 1,
			minIdVersion: 1,
			maxIdVersion: 255,
			commonErrorMessage: "Internal error: invalid version number of safe deal id",
		};
	}

	createId(data) {
		let result = "";

		const idVersion = this.params.currentIdVersion;

		this.checkIdVersion(idVersion);

		switch (idVersion) {
			case 1:
				const 
					idRandomPart = this.sdk.createId({format: "16chars"}),
					source = `${idRandomPart}${data.offer}${data.buyer}${data.validator}${data.fee}${idVersion}`,
					idHashPart = this.sdk.MD5(source).slice(0, 8),
					idVersionHex = this.getHexIdVersion(idVersion);

				result = `${idRandomPart}${idHashPart}${idVersionHex}`;
				break;
		
			default:
				throw new Error(this.params.commonErrorMessage);
		}

		return result;
	}

	checkIdVersion(idVersion) {
		if (!(this.params.minIdVersion <= idVersion && idVersion <= this.params.maxIdVersion)) {
			throw new Error(this.params.commonErrorMessage);
		}
	}

	checkId(id, data) {
		let result = false;

		const 
			idVersionHex = id.slice(-2),
			idVersion = parseInt(idVersionHex, 16);

		this.checkIdVersion(idVersion);

		switch (idVersion) {
			case 1:
				const 
					idRandomPart = id.slice(0, 16),
					idHashPart = id.slice(16, 24),
					source = `${idRandomPart}${data.offer}${data.buyer}${data.validator}${data.fee}${idVersion}`,
					calculatedIdHashPart = this.sdk.MD5(source).slice(0, 8);

				result = (idHashPart === calculatedIdHashPart);
				break;
		
			default:
				throw new Error(this.params.commonErrorMessage);
		};

		return result;
	}

	getHexIdVersion(idVersion) {
		let result = idVersion.toString(16);
		result = (result.length < 2 ? `0${result}` : result);
		if (result.length !== 2) {
			throw new Error(this.params.commonErrorMessage);
		};
		return result;
	}
}

export default { 
	IdHelper, 
}