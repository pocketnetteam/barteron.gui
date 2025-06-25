const 
	env = process.env.NODE_ENV,

	addressFilterIsEnabled = {
		production: true,
		development: true,
	},

	addressFilterAllowedItems = {
		production: [
			"PCJ2gYX2exnZtCnhE6maHTLQAfkJBFTgt9",
			"PHdW4pwWbFdoofVhSEfPSHgradmrvZdbE5",
			"PBjV827sqgz7dJybRb9MKbQKgzFGFzXWZc",
			"PBJoaPASrV3FTMqx4uXnYhBRb8KxXMyABp",
			"PUiSd363TKeeyH7c9bqMbQ77GJHPj2XcuR",
			"PHoESoQYyUsmGLLgihBAyUaQeigMAT5ttx",
			"PTHztc3NdJadFStNL3QZCX4JAF7f97LKHi",
			"PF8UvEzMo7dEDraFVsJpvToruBV5D8u3X3",
			"PSeRp7xPoK7cmHckjVqfET9hywerY78QA4",
			"PTsyPfHwVLjm5SNH2ha4hYNWxcV2ZrELHC",
			"PKh461d8jEaBYnKqKmeeh62ujCFMcct8h9",
			"PErTt9VweRwQWfjc2sqq1eNixbfFzc85zD",
			"PAmi64NCMHpuGYG7uRFFfaiUoRvwUxVgLx",
			"P8uLC23qDY5yxWQqYdNMd9SsXiCcj3kHAG",
			"PN95438ibecuDNMorKpfXGhbSr624gdzEr",
			"PDXHY9SvCoH2VQmukfWRqg9U5XyCsa11EB",
			"PGbX3mH5keS2dJHvwXbwdMDkKJ43JKcxpp",
			"PGYjGMZwokz1KSVqagxePxfHXXGwRLYTQs",
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
