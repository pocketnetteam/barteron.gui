import i18n from "@/i18n/index.js";
import SDK from "@/js/sdk.js";

const 
	API_URL = "https://p2p.back.pocketnet.app/barteron",
	method = "POST",
	commonHeaders = {
		"Content-Type": "application/json",
	};

class NetworkManager {
	checkSignPermission() {
		return this.sdk.checkPermission("sign");
	}

	getSignature() {
		return this.checkSignPermission().then(allowed => {
			if (allowed) {
				return this.sdk.sign("auth");
			};
			throw new Error("sign permission missing");
		});
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
}

class ChannelManager extends NetworkManager {
	constructor({ cannel, path }) {
		super();
		this.sdk = new SDK();
		this.cannel = cannel;
		this.path = path;
	}

	notificationsAllowed() {
		return this.checkSignPermission();
	}
	
	createSubscription(data) {
		return this.getSignature().then(signature => {
			return fetch(`${API_URL}/${this.path}/subscriptions`, {
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
		return this.getSignature().then(signature => {
			return fetch(`${API_URL}/${this.path}/subscriptions/get`, {
				method,
				headers: this.getHeaders(signature),
				body: JSON.stringify({
					address: userAddress,
				}),
			});
		}).then(response => {
			return response.json().then(result => {
				if (response.ok) {
					const subscription = result?.subscription;
					if (subscription) {
						subscription.channel = this.cannel;
					};
					return { subscription };
				};
				const message = this.getErrorMessage(response, result);
				throw new Error(message);
			});
		})
	}

	removeSubscription(userAddress) {
		return this.getSignature().then(signature => {
			return fetch(`${API_URL}/${this.path}/subscriptions/delete`, {
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
}

class TelegramManager extends ChannelManager {
	constructor() {
		super({ cannel: "telegram", path: "telegram-notifications" });
	}
}

class VKManager extends ChannelManager {
	constructor() {
		super({ cannel: "vk", path: "vk-notifications" });
	}
}

TelegramManager.botLink = "https://t.me/barteron_notify_bot";
VKManager.botLink = "https://vk.com/barteron_notify";

class NotificationSender extends NetworkManager {

	send(
		userAddresses, 
		messageType, 
		options = {selectedChannels: null}
	) {
		(userAddresses || []).forEach(f => {
			this.sendToUser(f, messageType, options);
		});
	}

	sendToUser(
		userAddress, 
		messageType, 
		options
	) {
		this.getSubscriptions(userAddress, options).then(subscriptions => {
			return subscriptions.reduce((result, value) => {
				const message = this.getMessage(messageType, value.locale);
				if (message) {
					result[value.channel] = { message };
				}
				return result;
			}, {});
		}).then(messages => {
			const needSend = (Object.keys(messages).length);
			if (!(needSend)) {
				return;
			};

			return this.getSignature().then(signature => {
				const data = {
					address: userAddress,
					data: messages,
				};

				return fetch(`${API_URL}/notifications/messages`, {
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
		}).catch(e => {
			console.error(e);
		});
	}

	getMessage(messageType, locale) {
		const 
			key = `notificationSettingsLabels.${messageType}_type_notification_message`,
			exists = i18n.te(key, locale);

		return exists ? i18n.t(key, locale) : null;
	}

	getSubscriptions(userAddress, options) {
		const 
			channels = [
				new TelegramManager(), 
				new VKManager(),
			],
			selectedChannels = options?.selectedChannels,
			promises = channels
				.filter(f => !(selectedChannels) || selectedChannels.includes(f.channel))
				.map(m => {
					return m.getSubscription(userAddress)
				});

		return Promise.allSettled(promises).then(results => {
			const subscriptions = results
				.filter(f => f.status === "fulfilled")
				.map(m => m.value?.subscription)
				.filter(f => f?.isEnabled);

			results
				.filter(f => f.status === "rejected")
				.map(m => m.reason)
				.forEach(f => {
					console.error(f);
				});

			return subscriptions;
		});
	}

}

export { 
	TelegramManager,
	VKManager,
	NotificationSender,
}