<template>
	<v-lightbox
		class="notifications-banner"
		size="lg"
		:visible="lightbox"
		:title="$t('notificationSettingsLabels.label')"
		@onHide="hide"
	>

		<v-dialog ref="dialog" />

		<strong 
			v-if="offerHasBeenPublished"
			class="title"
		>{{ $t("barterLabels.offer_has_been_published") }}</strong>

		<strong class="title">{{ $t("notificationSettingsLabels.prompt") }}:</strong>

		<div class="accordion">
			<div 
				class="accordion-item" 
			>
				<div 
					class="accordion-header" 
					:class="{ open: activeIndexes[0] }"
					@click="toggle(0)"
				>
					<span class="title">{{ $t("notificationSettingsLabels.OS_notifications") }}</span>
					<span 
						class="arrow" 
						:class="{ open: activeIndexes[0] }"
					>&#9662;</span>
				</div>
				<transition
					@enter="enter"
					@after-enter="afterEnter"
					@leave="leave"
				>
					<div 
						v-show="activeIndexes[0]" 
						class="accordion-content" 
						ref="contents"
					>
						<div class="content-holder">
							<p class="info">{{ $t(`notificationSettingsLabels.OS_notifications_main_${i18nPlatformKey}`) }}</p>
							
							<p 
								v-if="i18nPlatformKey === 'web'" 
								class="info"
							>
								<span>{{ $t("notificationSettingsLabels.OS_notifications_link") }}: </span>
								<a 
									href="#" 
									class="link" 
									@click.prevent="openAppsLink"
								>
									<u>{{ appsLink }}</u>
								</a>						
							</p>
							
							<p class="info">{{ $t("notificationSettingsLabels.OS_notifications_additional_info") }}</p>
						</div>
					</div>
				</transition>
			</div>

			<div 
				class="accordion-item" 
			>
				<div 
					class="accordion-header" 
					:class="{ open: activeIndexes[1] }"
					@click="toggle(1)"
				>
					<span class="title">{{ $t("notificationSettingsLabels.telegram_notifications") }}</span>
					<span 
						class="arrow" 
						:class="{ open: activeIndexes[1] }"
					>&#9662;</span>
				</div>
				<transition
					@enter="enter"
					@after-enter="afterEnter"
					@leave="leave"
				>
					<div 
						v-show="activeIndexes[1]" 
						class="accordion-content" 
						ref="contents"
					>
						<div class="content-holder">
							<!-- State: loading -->
							<div v-if="telegramData.currentState === 'loading'">
								<loader 
									type="circular" 
									align="top"
								/>
							</div>

							<!-- State: connected -->
							<div v-if="telegramData.currentState === 'connected'">
								<div class="half-top-space">
									<label class="v-label success-level">
										<i class="fa fa-check-circle"></i>
										{{ $t("notificationSettingsLabels.telegram_bot_connected") }}
									</label>
								</div>

								<v-button
									class="top-space"
									@click="disconnectTelegramBotEvent"
								>
									<i class="fa fa-unlink"></i>
									<span>{{ $t("buttonLabels.disconnect_telegram_bot") }}</span>
								</v-button>

								<label class="v-label info-level">
									<i class="fa fa-info-circle"></i>
									{{ $t("notificationSettingsLabels.disconnect_telegram_bot_info") }}
								</label>
							</div>

							<!-- State: disconnected -->
							<div v-if="telegramData.currentState === 'disconnected'">
								<div class="half-top-space">
									<label class="v-label warning-level">
										<i class="fa fa-exclamation-triangle"></i>
										{{ $t("notificationSettingsLabels.telegram_bot_disconnected") }}
									</label>
								</div>

								<p class="info half-top-space">
									<span>{{ $t("notificationSettingsLabels.telegram_notifications_step1") }}: </span>
									<a 
										href="#" 
										class="link" 
										@click.prevent="openTelegramBotLink"
									>
										<u>{{ telegramBotLink }}</u>
									</a>
								</p>

								<p class="info top-space">{{ $t("notificationSettingsLabels.telegram_notifications_step2") }}:</p>
								<v-input
									ref="telegramUsername"
									class="telegram-username"
									type="text"
									name="telegramUsername"
									id="telegramUsername"
									:placeholder="$t('notificationSettingsLabels.telegram_username_placeholder')"
									vSize="md"
								/>

								<p class="info top-space">{{ $t("notificationSettingsLabels.telegram_notifications_step3") }}:</p>
								<v-button
									@click="connectTelegramBot"
								>
									<i class="fa fa-link"></i>
									<span>{{ $t("buttonLabels.connect_telegram_bot") }}</span>
								</v-button>
							</div>
							
							<!-- State: error -->
							<div v-if="telegramData.currentState === 'error'">
								<label class="v-label error-level">
									<i class="fa fa-info-circle"></i>
									{{ $t("dialogLabels.common_error", {error: telegramData.stateData?.error?.message || ""}) }}
								</label>
								<v-button
									@click="loadTelegramData"
								>
									<i class="fa fa-redo"></i>
									<span>{{ $t("buttonLabels.update_status") }}</span>
								</v-button>
							</div>
						</div>
					</div>
				</transition>
			</div>
		</div>

		<template v-if="viewMode === 'banner'">
			<div class="notifications-banner-checkbox-holder">
				<v-switch
					class="no-padding"
					type="checkbox"
					name="notificationsBannerDisabled"
					:label="$t('notificationSettingsLabels.dont_show_again')"
					vType="checkbox"
					vSize="xl"
					@change="notificationsBannerDisabledChange"
				/>
			</div>

			<label
				class="v-label info-level"
			>
				<i class="fa fa-info-circle"></i>
				{{ $t("notificationSettingsLabels.manual_opening_info") }}
			</label>
		</template>

		<!-- Footer -->
		<template #footer>
			<div class="row full-width right">
				<div class="buttons-holder min-h-w">
					<v-button 
						@click="hide"
					>
						<span>{{ $t('buttonLabels.close') }}</span>
					</v-button>
				</div>
			</div>
		</template>
	</v-lightbox>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>