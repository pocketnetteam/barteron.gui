<template>
	<v-aside class="profile">
		<!-- Profile stats -->
		<div class="box">
			<Profile :hash="address"/>

			<div 
				v-if="isMyProfile" 
				class="setup-notifications"
			>
				<v-button
					vType="hit"
					@click="setupNotifications"
				>{{ $t('buttonLabels.setup_notifications') }}</v-button>
			</div>

			<div 
				v-if="!(isMyProfile)" 
				class="message"
			>
				<v-button
					@click="createRoom"
				>{{ $t('buttonLabels.send_message') }}</v-button>
			</div>
		</div>

		<!-- Wallet -->
		<div class="box" v-if="isMyProfile">
			<Wallet />
		</div>

		<!-- Safe deal -->
		<div class="box" v-if="isValidator">
			<SafeDealProfile
				:hash="address"
			/>
		</div>

		<!-- Exchange -->
		<div class="box">
			<ProfileExchangeList 
				 :hash="address"
			/>
		</div>
	</v-aside>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>