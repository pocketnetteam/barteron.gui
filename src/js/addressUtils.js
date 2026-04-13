const addressCache = new Map();

function formatAddress_OSM(
	data, 
	options = {
		includeDistrict: false,
		includePostcode: false,
	}
) {
    const 
		displayName = data?.display_name,
		address = data?.address;

	if (!address) return displayName;

	const 
		cacheKey = displayName,
		optionsKey = options ? JSON.stringify(options) : "",
		finalKey = cacheKey && `${cacheKey}_${optionsKey}`;

		if (finalKey && addressCache.has(finalKey)) {
			return addressCache.get(finalKey);
		};

	const 
		countryCode = address?.country_code;
	
	const rawParts = {
		road: address.road || "",
		house: address.house_number || "",
		district: address.suburb || address.city_district || "",
		settlement: address.city || address.town || address.village || address.hamlet || "",
		region: address.state || "",
		country: address.country || "",
		postcode: address.postcode || "",
	};

	const replacements = {
		"ru": {
			"область": "обл.",
			"район": "р-н",
			"административный": "адм.",
			"округ": "окр.",
			"улица": "ул.",
			"проспект": "пр-т",
			"переулок": "пер.",
			"площадь": "пл.",
			"шоссе": "ш.",
			"бульвар": "б-р",
			"строение": "стр.",
			"корпус": "корп.",
		},
	};

	const shorten = (text) => {
		const dict = replacements[countryCode];

		if (!text) return "";
		if (!dict) return text;

		const updated = text.split(" ").map(word => {
			const target = word.trim();
			return dict[target.toLowerCase()] || target;
		}).join(" ");

		return updated;
	};

	const isDublicateRegion = rawParts.region.toLowerCase().includes(rawParts.settlement.toLowerCase()) 
		|| rawParts.settlement.toLowerCase().includes(rawParts.region.toLowerCase().replace(" область", "").replace(" обл.", ""));

	const 
		postcode = options?.includePostcode && rawParts.postcode,
		country = rawParts.country,
		region = isDublicateRegion ? "" : shorten(rawParts.region),
		settlement = shorten(rawParts.settlement),
		district = options?.includeDistrict && shorten(rawParts.district),
		road = shorten(rawParts.road),
		house = rawParts.house;

	const needReverse = ["ru", "ua", "by"].includes(countryCode);

	let parts = needReverse ? [
		postcode,
		country,
		region,
		settlement,
		district,
		road,
		house,
	] : [
		road,
		house,
		district,
		settlement,
		region,
		postcode,
		country,
	];

	const result = [...new Set(parts.filter(Boolean))].join(", ");

	if (finalKey) {
		addressCache.set(finalKey, result);
	};

	return result;
}

export { formatAddress_OSM }