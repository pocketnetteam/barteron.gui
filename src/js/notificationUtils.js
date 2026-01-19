import i18n from "@/i18n/index.js";
import SDK from "@/js/sdk.js";

const 
	API_URL = "https://p2p.back.pocketnet.app/barteron",
	method = "POST",
	commonHeaders = {
		"Content-Type": "application/json",
	};

class TelegramManager {
	constructor() {
		this.sdk = new SDK();
	}

	getHeaders(signature) {
		return {
			...commonHeaders,
			Signature: JSON.stringify(signature),
		};
	}
	
	getErrorMessage(response, result) {
		const defaultMessage = `HTTP error: ${response?.status ?? "unknown status"}`;
		return result?.message || defaultMessage;
	}

	createSubscription(data) {
		return this.sdk.sign("auth").then(signature => {
			return fetch(`${API_URL}/telegram-notifications/subscriptions`, {
				method,
				headers: this.getHeaders(signature),
				body: JSON.stringify(data),
			});
		}).then(response => {
			return response.json().then(result => {
				if (response.ok) {
					return result;
				};
				const message = this.getErrorMessage(response, result);
				throw new Error(message);
			});
		})
	}

	getSubscription(userAddress) {
		return this.sdk.sign("auth").then(signature => {
			return fetch(`${API_URL}/telegram-notifications/subscriptions/get`, {
				method,
				headers: this.getHeaders(signature),
				body: JSON.stringify({
					address: userAddress,
				}),
			});
		}).then(response => {
			return response.json().then(result => {
				if (response.ok) {
					return result;
				};
				const message = this.getErrorMessage(response, result);
				throw new Error(message);
			});
		})
	}

	sendMessageBySubscription(subscription) {
		if (!(subscription.isEnabled)) {
			return Promise.reject('subscription disabled');
		};

		const data = {
			address: subscription.address,
			message: i18n.t("notificationSettingsLabels.default_notify_message_for_telegram_bot", subscription.locale),
		};

		return this.sdk.sign("auth").then(signature => {
			return fetch(`${API_URL}/telegram-notifications/messages`, {
				method,
				headers: this.getHeaders(signature),
				body: JSON.stringify(data),
			});
		}).then(response => {
			return response.json().then(result => {
				if (response.ok) {
					return result;
				};
				const message = this.getErrorMessage(response, result);
				throw new Error(message);
			});
		});
	}

	removeSubscription(userAddress) {
		return this.sdk.sign("auth").then(signature => {
			return fetch(`${API_URL}/telegram-notifications/subscriptions/delete`, {
				method,
				headers: this.getHeaders(signature),
				body: JSON.stringify({
					address: userAddress,
				}),
			});
		}).then(response => {
			return response.json().then(result => {
				if (response.ok) {
					return result;
				};
				const message = this.getErrorMessage(response, result);
				throw new Error(message);
			});
		})
	}

	sendNotifications(userAddresses) {
		const 
			uniqueItems = [...new Set(userAddresses || [])],
			promises = uniqueItems.map(item => {
				return this.getSubscription(item);
			});

		Promise.allSettled(promises).then(results => {
			const subscriptions = results
				.filter(f => f.status === 'fulfilled')
				.map(m => m.value?.subscription)
				.filter(f => f?.isEnabled);

			results
				.filter(f => f.status === 'rejected')
				.map(m => m.reason)
				.forEach(f => {
					console.error(f);
				});

			return subscriptions;

		}).then(subscriptions => {
			const promises = (subscriptions || []).map(item => {
				return this.sendMessageBySubscription(item);
			});

			return Promise.allSettled(promises).then(results => {
				results
					.filter(f => f.status === 'rejected')
					.map(m => m.reason)
					.forEach(f => {
						console.error(f);
					});
			});
		}).catch(e => {
			console.error(e);
		});
	}

}

TelegramManager.telegramBotLink = "https://t.me/barteron_notify_bot";

export { 
	TelegramManager, 
}