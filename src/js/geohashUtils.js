import { bboxes, decode_bbox } from "ngeohash";

class GeoHashApproximator {

	constructor(visibleBounds, params = {}) {
		this.visibleBounds = visibleBounds;
		this.params = {
			maxCount: 300,
			maxPrecision: 7,
			...params
		}
	}

	getGeohashItems() {
		const mainBounds = this.visibleBounds;
		let precision = 1;
		let result = this.getGeohashesForBounds(mainBounds, precision);
		let temp = [];

		while (true) {
			result.forEach(item => {

				const needDivide =
					this.geohashCoversBounds(item, mainBounds) 
					&& !(this.geohashIsEqualToBounds(item, mainBounds))
					|| this.geohashIntersectsBounds(item, mainBounds);
				
				if (needDivide) {
					const bounds = this.getBoundsOfGeohash(item);
					
					let newItems = this.getGeohashesForBounds(
						bounds, 
						precision + 1
					).filter(f => !(temp.includes(f) || this.geohashOutOfBounds(f, mainBounds)));

					temp = temp.concat(newItems);

				} else if (this.geohashInsideBounds(item, mainBounds)) {
					temp.push(item);
				}
			})

			if (temp.length <= this.params.maxCount && precision < this.params.maxPrecision) {
				result = temp;
				temp = [];
				precision++;
			} else {
				break;
			}
		}

		return result;
	}

	getBoundsOfGeohash(geohash) {
		const [minLat, minLon, maxLat, maxLon] = decode_bbox(geohash);
		return { 
			_northEast: { lat: maxLat, lng: maxLon }, 
			_southWest: { lat: minLat, lng: minLon } 
		}
	}

	getGeohashesForBounds(bounds, precision) {
		return bboxes(
			bounds._southWest.lat, 
			bounds._southWest.lng, 
			bounds._northEast.lat, 
			bounds._northEast.lng, 
			precision
		);
	}

	geohashCoversBounds(geohash, bounds) {
		const geohashBounds = this.getBoundsOfGeohash(geohash);
		return geohashBounds._northEast.lat >= bounds._northEast.lat
			&& geohashBounds._northEast.lng >= bounds._northEast.lng
			&& geohashBounds._southWest.lat <= bounds._southWest.lat
			&& geohashBounds._southWest.lng <= bounds._southWest.lng
	}

	geohashIsEqualToBounds(geohash, bounds) {
		const geohashBounds = this.getBoundsOfGeohash(geohash);
		return geohashBounds._northEast.lat === bounds._northEast.lat
			&& geohashBounds._northEast.lng === bounds._northEast.lng
			&& geohashBounds._southWest.lat === bounds._southWest.lat
			&& geohashBounds._southWest.lng === bounds._southWest.lng
	}

	geohashOutOfBounds(geohash, bounds) {
		const geohashBounds = this.getBoundsOfGeohash(geohash);
		return geohashBounds._southWest.lat >= bounds._northEast.lat
			|| geohashBounds._southWest.lng >= bounds._northEast.lng
			|| geohashBounds._northEast.lat <= bounds._southWest.lat
			|| geohashBounds._northEast.lng <= bounds._southWest.lng;
	}

	geohashInsideBounds(geohash, bounds) {
		const geohashBounds = this.getBoundsOfGeohash(geohash);
		return geohashBounds._northEast.lat <= bounds._northEast.lat
			&& geohashBounds._northEast.lng <= bounds._northEast.lng
			&& geohashBounds._southWest.lat >= bounds._southWest.lat
			&& geohashBounds._southWest.lng >= bounds._southWest.lng;
	}

	geohashIntersectsBounds(geohash, bounds) {
		return !(
			this.geohashCoversBounds(geohash, bounds) 
			|| this.geohashOutOfBounds(geohash, bounds)
			|| this.geohashInsideBounds(geohash, bounds)
		);
	}

}

export { GeoHashApproximator };