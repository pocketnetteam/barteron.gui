import i18n from "@/i18n/index.js";

const 
	API_URL = "https://p2p.back.pocketnet.app/barteron",
	TOKEN = process.env.VUE_APP_NOTIFICATION_AUTH_TOKEN;

const 
	method = "POST",
	headers = {
		"Authorization": `Bearer ${TOKEN}`,
		"Content-Type": "application/json",
	};

class TelegramManager {

	createSubscription(data) {
		return fetch(`${API_URL}/telegram-notifications/subscriptions`, {
			method,
			headers,
			body: JSON.stringify(data)
		}) .then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error: ${response.status}`);
			}
			return response.json();
		})
	}

	getSubscription(userAddress) {
		return fetch(`${API_URL}/telegram-notifications/subscriptions/get`, {
			method,
			headers,
			body: JSON.stringify({
				address: userAddress,
			})
		}) .then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error: ${response.status}`);
			}
			return response.json();
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

		return fetch(`${API_URL}/telegram-notifications/messages`, {
			method,
			headers,
			body: JSON.stringify(data)
		}) .then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error: ${response.status}`);
			}
			return response.json();
		});
	}

	removeSubscription(userAddress) {
		return fetch(`${API_URL}/telegram-notifications/subscriptions/delete`, {
			method,
			headers,
			body: JSON.stringify({
				address: userAddress,
			})
		}) .then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error: ${response.status}`);
			}
			return response.json();
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