const 
	API_URL = "https://p2p.back.pocketnet.app/barteron",
	TOKEN = process.env.VUE_APP_NOTIFICATION_AUTH_TOKEN;


class TelegramManager {

	createSubscription(data) {
		return fetch(`${API_URL}/telegram-notifications/subscriptions`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${TOKEN}`,
				'Content-Type': 'application/json'
			},
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
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${TOKEN}`,
				'Content-Type': 'application/json'
			},
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

	removeSubscription(userAddress) {
		return fetch(`${API_URL}/telegram-notifications/subscriptions/delete`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${TOKEN}`,
				'Content-Type': 'application/json'
			},
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

}

TelegramManager.telegramBotLink = "https://t.me/barteron_notify_bot";

export { 
	TelegramManager, 
}