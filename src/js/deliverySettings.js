import deliveryData from "../../public/delivery_data.json";

const 
	env = process.env.NODE_ENV,
	addressFilter = {
		isEnabled: (deliveryData?.addressFilterIsEnabled[env] || false),
		items: (deliveryData?.addressFilterAllowedItems[env] || []),
	};

const deliverySettings = {
	addressFilter,
};

export default deliverySettings;
