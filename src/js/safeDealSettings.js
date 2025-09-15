const safeDealData = {
	validatorAddresses: {
		development: [
			"TVABvVQKn6MaqXziDaUjW5afg9EcGdGQuX",
			"THC9eiAxFEA9TFv8jLCsoDuLNsa2gCmw6V",
			"TJmXy5Q4jgR6QzB7qmncFoURmVMBB95aL6",
			"TWEE5wJDL2EjR6iryH5mTyebDZWRbPZ733",
			"TCBZP1MiPCCyevfa31wKp3xQedwVa7Tdn4",
		],

		production: [

		],
	},
}

const 
	env = process.env.NODE_ENV,
	validatorAddresses = safeDealData.validatorAddresses[env] || [];

const safeDealSettings = {
	validatorAddresses,
};

export default safeDealSettings;
