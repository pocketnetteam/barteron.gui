class RequestIdError extends Error {
	constructor(requestName, id, currentId) {
		const message = `Request "${requestName}" rejected by id = ${id}, current id = ${currentId}`;
		super(message);
		this.name = this.constructor.name;
		this.requestName = requestName;
		this.id = id;
		this.currentId = currentId;
	}
}

export default { RequestIdError }