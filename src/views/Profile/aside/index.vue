<template>
	<v-aside class="profile">
		<!-- Profile stats -->
		<div class="box">
			<Profile :hash="address">

				<!-- State -->
				<template #state>
					<dl class="list">
						<dt><i class="fa fa-user-shield"></i></dt>
						<dd>{{ $t('profileLabels.account_confirmed') }}</dd>
					</dl>
				</template>
			</Profile>

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