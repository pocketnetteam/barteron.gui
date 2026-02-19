<template>
	<v-lightbox
		class="select-validator-dialog"
		size="md"
		:visible="lightbox"
		:title="$t('safeDealLabels.select_validator')"
		@onHide="hide"
	>
		<ul 
			v-if="filteredAdresses?.length"
			class="validators-list"
		>
			<li
				v-for="(item, index) in filteredAdresses"
				:key="index"
				class="validator-item"
				:class="{ 'selected': selectedIndex === index }"
				@click="() => selectedIndex = index"
			>
				<i 
					:class="{
						'check': true,
						'fa fa-check-circle': selectedIndex === index,
					}"
				></i>
				<Profile 
					:ref="`profile-${index}`"
					:hash="item"
					:hideBastyonProfileButton="true"
					:showValidationConditions="true"
				/>
			</li>
		</ul>

		<div v-else-if="isLoading">
			<loader 
				type="circular" 
				align="top"
			/>
		</div>

		<div 
			v-else-if="loadingError"
			class="row dir-column gap-md align-center"
		>
			<div>
				<label class="v-label error-level">
					<i class="fa fa-info-circle"></i>
					{{ $t("dialogLabels.common_loading_error", {error: loadingError.message}) }}
				</label>
			</div>
			<v-button 
				vType="hit"
				@click="repeatLoading"
			>
				<span>{{ $t('buttonLabels.repeat') }}</span>
			</v-button>
		</div>

		<div v-else>
			<p>{{ $t("safeDealLabels.empty_validators_list") }}</p>
		</div>

		<!-- Footer -->
		<template #footer>
			<div class="row full-width right">
				<div class="buttons-holder min-h-w">
					<v-button 
						:disabled="!(filteredAdresses?.[selectedIndex])"
						@click="select"
					>
						<span>{{ $t('buttonLabels.select') }}</span>
					</v-button>
				</div>
			</div>
		</template>
	</v-lightbox>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>