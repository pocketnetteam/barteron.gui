<template>
	<v-aside>
		<v-details
			v-if="subCategories?.length"
			:title="$t('categoryLabels.label')"
			:open="true"
		>
			<SubCategories :items="subCategories" />
		</v-details>

		<v-details
			:title="$t('priceLabels.label')"
			:open="true"
		>
			<div class="row">
				<v-input
					:id="['price_min', 'price_max']"
					:placeholder="[$t('priceLabels.from'), $t('priceLabels.to')]"
					:value="[filters.priceMin, filters.priceMax]"
					ref="price"
					min="0"
					type="minmax"
					vSize="lg"
					:vEvents="{
						change: changePrice,
						input: changePrice
					}"
				/>
			</div>

			<div class="row">
				<v-switch
					type="radio"
					name="price"
					:value="['-10', '10-50', '50-100', '100-', '-']"
					:label="[
						$t('priceLabels.under', { to: 10 }),
						$t('priceLabels.range', { from: 10, to: 50 }),
						$t('priceLabels.range', { from: 50, to: 100 }),
						$t('priceLabels.over', { from: 100 }),
						$t('priceLabels.no_matter')
					]"
					@change="changePrice"
				/>
			</div>
		</v-details>

		<!-- <v-details
			:title="$t('conditionLabels.label')"
			:open="true"
		>
			<v-switch
				ref="condition"
				type="checkbox"
				name="condition"
				:set="condition = parseLabels('conditionLabels')"
				:label="condition.map(item => item.text)"
				:value="condition.map(item => item.value)"
				@change="changeCondition"
			/>
		</v-details> -->

		<!-- <v-details
			:title="$t('typeLabels.label')"
			:open="true"
		>
			<v-switch
				id="gaming_notebook"
				type="checkbox"
				:set="type = parseLabels('typeLabels.notebook')"
				:label="type.map(item => item.text)"
				:value="type.map(item => item.value)"
			/>
		</v-details> -->

		<div class="v-details filter-apply">
			<v-button
				:disabled="applyDisabled"
				@click="applyFilters"
			>{{ $t('buttonLabels.apply') }}</v-button>
		</div>
	</v-aside>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>