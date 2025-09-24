const safeDealData = {
	validatorAddresses: {
		development: [
			"TVABvVQKn6MaqXziDaUjW5afg9EcGdGQuX",
			"THC9eiAxFEA9TFv8jLCsoDuLNsa2gCmw6V",
			"TJmXy5Q4jgR6QzB7qmncFoURmVMBB95aL6",
			"TWEE5wJDL2EjR6iryH5mTyebDZWRbPZ733",
		],

		production: [

		],
	},

	defaultValidatorValues: {
		feePercent: 5,
	},
}

const 
	env = process.env.NODE_ENV,
	validatorAddresses = safeDealData.validatorAddresses[env] || [],
	defaultValidatorValues = safeDealData.defaultValidatorValues;

export default {
	validatorAddresses,
	defaultValidatorValues,
};
