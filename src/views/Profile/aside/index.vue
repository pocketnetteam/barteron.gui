<template>
	<v-aside>
		<!-- Profile stats -->
		<div class="box">
			<Profile>
				<!-- Edit button -->
				<template #edit>
					<v-button vType="stroke-bulma">
						{{ $t('profile.edit') }}
					</v-button>
				</template>

				<!-- State -->
				<template #state>
					<dl class="list">
						<dt><i class="fa fa-user-shield"></i></dt>
						<dd>{{ $t('profile.account_confirmed') }}</dd>
					</dl>

					<a class="ask" href="#"><i class="fa fa-question"></i></a>
				</template>
			</Profile>
		</div>

		<!-- Wallet -->
		<div class="box">
			<Wallet />
		</div>

		<!-- Exchange -->
		<div class="box">
			<ExchangeList>
				<template #edit>
					<v-button vType="stroke-bulma">
						{{ $t('exchange.edit') }}
					</v-button>
				</template>
			</ExchangeList>
		</div>

		<!-- Settings -->
		<div class="settings">
			<ul class="list">
				<li><a href="#" class="link"><i class="fa fa-cog"></i> {{ $t('profile.settings') }}</a></li>
				<li><a href="#" class="link"><i class="fa fa-question-circle"></i> {{ $t('profile.contact_support') }}</a></li>
			</ul>
		</div>
	</v-aside>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>