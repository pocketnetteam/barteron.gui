const safeDealData = {
	validatorAddresses: {
		development: [
			"TVABvVQKn6MaqXziDaUjW5afg9EcGdGQuX",
			"THC9eiAxFEA9TFv8jLCsoDuLNsa2gCmw6V",
			"TJmXy5Q4jgR6QzB7qmncFoURmVMBB95aL6",
			"TWEE5wJDL2EjR6iryH5mTyebDZWRbPZ733",
		],

		production: [
			"PBjV827sqgz7dJybRb9MKbQKgzFGFzXWZc",
			"PPbNqCweFnTePQyXWR21B9jXWCiDJa2yYu",
		],
	},

	defaultValidatorValues: {
		feePercent: 5,
	},

	allowedAddressFilter: {
		isEnabled: {
			production: true,
			development: true,
		},

		items: {
			development: [
				"TWEE5wJDL2EjR6iryH5mTyebDZWRbPZ733",
				"TCBZP1MiPCCyevfa31wKp3xQedwVa7Tdn4",
				"TVSeQiPd94EHuE5KVX986V4d1qw4ZdU4L1",
			],

			production: [
				"PPbNqCweFnTePQyXWR21B9jXWCiDJa2yYu",
				"PBjV827sqgz7dJybRb9MKbQKgzFGFzXWZc",
				"PXYhCbTwPaUHrP6spJM5NY84TBpLQJtZi5",
				"PR7srzZt4EfcNb3s27grgmiG8aB9vYNV82",
				"PCJ2gYX2exnZtCnhE6maHTLQAfkJBFTgt9",
				"PEmxMUL35Z5rtULmHMuYLNYsQGu23HXBeX",
				"PMkhdDuCM3k8xLRDBUnmBDcUMWjhfPbWbE",
				"PQ412SrFxSH1UZchG14FZ3ZsydHfcEh8o7",
			],
		}
	}
}

const 
	env = process.env.NODE_ENV,
	validatorAddresses = safeDealData.validatorAddresses[env] || [],
	defaultValidatorValues = safeDealData.defaultValidatorValues,
	allowedAddressFilter = {
		isEnabled: safeDealData.allowedAddressFilter.isEnabled[env],
		items: safeDealData.allowedAddressFilter.items[env],
	}

export default {
	validatorAddresses,
	defaultValidatorValues,
	allowedAddressFilter,
};
