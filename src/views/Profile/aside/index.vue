<template>
	<v-aside>
		<!-- Profile stats -->
		<div class="box">
			<Profile :address="address">
				<!-- Edit button -->
				<!-- <template #edit>
					<v-button vType="bulma-stroke">
						{{ $t('profileLabels.edit') }}
					</v-button>
				</template> -->

				<!-- State -->
				<template #state>
					<dl class="list">
						<dt><i class="fa fa-user-shield"></i></dt>
						<dd>{{ $t('profileLabels.account_confirmed') }}</dd>
					</dl>

					<a class="ask" href="#"><i class="fa fa-question"></i></a>
				</template>
			</Profile>
		</div>

		<!-- Wallet -->
		<div class="box" v-if="isMyProfile">
			<Wallet />
		</div>

		<!-- Exchange -->
		<div class="box">
			<ExchangeList
				:tags="account?.tags || []"
				:editable="isMyProfile"
				@change="(tags) => account.set({ tags })"
			>
				<template #edit="{ instance }">
					<!-- Edit button -->
					<template v-if="!instance.editing">
						<v-button vType="bulma-stroke" @click="instance.edit">
							{{ $t('buttonLabels.edit') }}
						</v-button>
					</template>

					<!-- Cancel and Save buttons -->
					<template v-else>
						<div class="buttons-holder">
							<v-button vType="chi-chi" @click="instance.cancel">
								{{ $t('buttonLabels.cancel') }}
							</v-button>

							<v-button @click="instance.save">
								{{ $t('buttonLabels.save') }}
							</v-button>
						</div>
					</template>
				</template>
			</ExchangeList>
		</div>

		<!-- Settings -->
		<div class="settings">
			<ul class="list">
				<!-- <li><a href="#" class="link"><i class="fa fa-cog"></i> {{ $t('profileLabels.settings') }}</a></li> -->
				<li><a href="#" class="link"><i class="fa fa-question-circle"></i> {{ $t('profileLabels.contact_support') }}</a></li>
			</ul>
		</div>
	</v-aside>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>