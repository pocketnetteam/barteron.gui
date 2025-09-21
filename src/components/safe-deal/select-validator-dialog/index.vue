<template>
	<v-lightbox
		class="select-validator-dialog"
		size="md"
		:visible="lightbox"
		:title="$t('safeDealLabels.select_validator')"
		@onHide="hide"
	>
		<ul 
			v-if="filteredItems?.length"
			class="validators-list"
		>
			<li
				v-for="(item, index) in filteredItems"
				:key="index"
				class="validator-item"
				:class="{ 'selected': selectedIndex === index }"
				@click="() => selectedIndex = index"
			>
				<i class="check fa fa-check-circle"></i>
				<Profile 
					:ref="`profile-${index}`"
					:hash="item"
					:showValidationConditions="true"
				/>
			</li>
		</ul>

		<div v-else>
			<p>{{ $t("safeDealLabels.empty_validators_list") }}</p>
		</div>

		<!-- Footer -->
		<template #footer>
			<div class="row full-width right">
				<div class="buttons-holder min-h-w">
					<v-button 
						:disabled="!filteredItems[selectedIndex]"
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