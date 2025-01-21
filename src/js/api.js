/**
 * Allow work with backend
 * 
 * @class API
 */
class API {
	fetch(address, params) {
		return fetch(`/contacts/${ address }`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json"
			},
			...params
		});
	}

	getContacts(address) {
		return this.fetch(address);
	}

	setContacts(address, data) {
		return this.fetch(address, data);
	}
}

export default API;