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
					
					const newItems = this.getGeohashesForBounds(bounds, precision + 1);
					const newItemsWithoutSideGeohashes = newItems.filter(f => f.indexOf(item) === 0);
					const newItemsToAdd = newItemsWithoutSideGeohashes.filter(
						f => !(temp.includes(f) || this.geohashOutOfBounds(f, mainBounds))
					);

					temp = temp.concat(newItemsToAdd);

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

class GeoHashLimitator {
	constructor(location = [], allowedAreaAlias = "") {
		this.location = location;
		this.allowedAreaAlias = allowedAreaAlias;
	}

	getAllowedArea() {
		let items = [];

		switch (this.allowedAreaAlias) {
			case "Canada,USA":
				items = [
					"bk,bs,bu,b7,be,bg,b6,bd,bf,b1,b3,b9",
					"b5x,b5m,b5q,b5r,b5n,b5p",
					"zc",
					"c",
					"fn,fq,fw,fj,fm,fh,fk,fs,f5,f7,fe,f4,f6,fd,f1,f3,f9,fc,f0,f2,f8,fb",
					"87,8e",
					"9p,9r,9x,9z,9n,9q,9w,9y,9m,9t,9v,9u",
					"dp,dr,dx,dn,dq,dj,dh",
				];
				break;

			default:
				break;
		}

		return items.reduce(
			(res, item) => res.concat(item.split(",")),
			[]
		);
	}

	limit() {
		let result = [];
		const allowedArea = this.getAllowedArea();
		if (!(this.location.length)) {
			result = allowedArea;
		} else {
			for (let i = 0; i < this.location.length; i++) {
				const item = this.location[i];
				for (let j = 0; j < allowedArea.length; j++) {
					const allowedItem = allowedArea[j];
					if (item.length >= allowedItem.length) {
						const itemInsideAllowedItem = (item.indexOf(allowedItem) === 0);
						if (itemInsideAllowedItem) {
							result.push(item);
							break;
						}
					} else {
						const allowedItemIsPartOfLocation = (allowedItem.indexOf(item) === 0);
						if (allowedItemIsPartOfLocation) {
							result.push(allowedItem);
							continue;
						}
					}
				}
			}
		}
		return result;
	}

}

class GeohashBoundsHelper {
	constructor(latlng, sideLengthInKm) {
		const [lat, lng] = latlng;
		this.center = {lat, lng};
		this.sideLength = sideLengthInKm;
	}

	getBounds() {
		const
			R = 6371, /* Radius of the earth in km */
			phi = this.center.lat * Math.PI / 180,
			lat_per_km = 180 / (Math.PI * R),
			lng_per_km = 360 / (2 * Math.PI * Math.cos(phi) * R),
			dLat = lat_per_km * this.sideLength,
			dLng = lng_per_km * this.sideLength;

		return {
			_southWest: {
				lat: this.center.lat - dLat / 2,
				lng: this.center.lng - dLng / 2
			},
			_northEast: {
				lat: this.center.lat + dLat / 2,
				lng: this.center.lng + dLng / 2
			}
		};
	}
}

export { GeoHashApproximator, GeoHashLimitator, GeohashBoundsHelper };