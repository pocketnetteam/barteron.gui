<template>
	<v-aside 
		v-if="userHasAccess"
		class="safe-deal"
	>
		<!-- Profile stats -->
		<div class="box">
			<strong class="subtitle">{{ shownUserData.title }}</strong>

			<Profile :hash="shownUserData.address">
				<!-- State -->
				<template #state>
					<dl class="list">
						<dt><i class="fa fa-user-shield"></i></dt>
						<dd>{{ $t('profileLabels.account_confirmed') }}</dd>
					</dl>
				</template>
			</Profile>

			<div class="message">
				<v-button @click="openSafeDealRoom">
					{{ $t('buttonLabels.open_deal_chat') }}
				</v-button>
			</div>

			<div class="row t-sep id-holder">
				<span>№ {{ id }}</span>
			</div>
		</div>

		<div class="box">
			<strong class="subtitle">{{ $t('safeDealLabels.deal_status') }}</strong>

			<SafeDealStatus
				:statusesLoading="statusesLoading"
				:statusesLoadingError="statusesLoadingError"
				:items="statusItems"
				:currentStatus="currentStatus"
			/>

			<div class="safe-deal-sep"></div>

			<div class="update-status">
				<v-button @click="updateStatus">
					<i class="fa fa-sync"></i>
					<span>{{ $t('buttonLabels.update_status') }}</span>
				</v-button>
			</div>

			<label class="v-label info-level top-margin">
				<i class="fa fa-info-circle"></i>
				{{ $t('safeDealLabels.hint_for_update_status') }}
			</label>
		</div>
	</v-aside>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>