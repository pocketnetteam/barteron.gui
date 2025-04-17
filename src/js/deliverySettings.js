const 
	env = process.env.NODE_ENV,

	addressFilterIsEnabled = {
		production: true,
		development: true,
	},

	addressFilterAllowedItems = {
		production: [

		],
		development: [
			"TCBZP1MiPCCyevfa31wKp3xQedwVa7Tdn4",
			"TVSeQiPd94EHuE5KVX986V4d1qw4ZdU4L1",
		],
	};

const addressFilter = {
	isEnabled: (addressFilterIsEnabled[env] || false),
	items: (addressFilterAllowedItems[env] || []),
};

const deliverySettings = {
	addressFilter,
};

export default deliverySettings;