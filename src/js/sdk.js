/**
 * Allow work with bastyon
 * 
 * @class SDK
 */
class SDK {
	constructor() {
		this.account = [];
		this.lastresult = '';
		this.address = '';
		this.emitted = [];
		this.localstorage = '';

		this.sdk = new window.BastyonSdk();
		this.sdk.emit('loaded');

		this.sdk.on('action', (d) => {
			this.emitted.push({
				type : 'action',
				data : JSON.stringify(d),
				date : new Date(),
			})
		});

		this.sdk.on('balance', (d) => {
			this.emitted.push({
				type : 'balance',
				data : JSON.stringify(d),
				date : new Date(),
			})
		});
	}

	setLastResult(e) {
		this.lastresult = e;
	}

	clearLastResult() {
		this.setLastResult('');
	}

	openSettings() {
		this.sdk.helpers.opensettings().then(() => {
			this.lastresult = 'opensettings: success'

		}).catch(e => this.setLastResult(e))
	}

	imageFromMobileCamera() {
		this.sdk.get.imageFromMobileCamera().then((images) => {
			this.lastresult = 'imageFromMobileCamera: success (console.log)'
			console.log(images)

		}).catch(e => this.setLastResult(e))
	}

	alertMessage() {
		this.sdk.helpers.alert('Test message').then(() => {
			this.lastresult = 'alert: success'
		}).catch(e => this.setLastResult(e))
	}

	/**
	 * Request permissions
	 * 
	 * @param {Array} permissions
	 * @returns 
	 */
	requestPermissions(permissions) {
		return this.sdk.request.permissions(permissions).then(() => {
			this.lastresult = 'messaging: granted'
		}).catch(e => this.setLastResult(e))
	}

	/**
	 * Get account
	 * @return {String}
	 */
	getAccount() {
		return this.sdk.get.account().then(address => {
			this.lastresult = 'user address: ' + address;
			this.address = address;
			return address;
		}).catch(e => this.setLastResult(e));
	}

	getNodeInfo() {
		this.sdk.rpc('getnodeinfo').then(data => {
			this.lastresult = JSON.stringify(data, null, "\t");
		}).catch(e => this.setLastResult(e));
	}

	getUserInfo() {
		if(!this.address) return

		return this.sdk.rpc('getuserprofile', [[this.address]]).then(data => {
			this.lastresult = data;
			this.account = data;
			return data;
		}).catch(e => this.setLastResult(e))
	}

	makePayment() {
		var data = {
			'recievers' : [{
				address : 'PR7srzZt4EfcNb3s27grgmiG8aB9vYNV82',
				amount : 0.01
			}], 
			'feemode' : 'include', 
			'message' : ''
		}

		this.sdk.payment(data).then(data => {
			this.lastresult = JSON.stringify(data, null, '\t')
		}).catch(e => this.setLastResult(e));
	}

	getLocation() {
		return this.sdk.get.location().then(data => {
			this.lastresult = data;
			this.account = data;
			return data;
		}).catch(e => this.setLastResult(e))
	}

	checkLocalStorageAccess() {
		function allStorage() {
			var values = [],
				keys = Object.keys(localStorage),
				i = keys.length;

			while ( i-- ) {
				values.push( localStorage.getItem(keys[i]) );
			}

			return values;
		}

		localStorage['checkLocalStorageAccess'] = true
		this.localstorage = allStorage()
	}
}

export default new SDK();