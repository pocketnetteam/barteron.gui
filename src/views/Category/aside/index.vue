<template>
	<v-aside>
		<v-details
			v-if="subCategories?.length"
			:title="$t('category.label')"
			:open="true"
		>
			<SubCategories :items="subCategories" />
		</v-details>

		<v-details
			:title="$t('filterLabels.price')"
			:open="true"
		>
			<v-input
				:id="['price_min', 'price_max']"
				:placeholder="[$t('filterLabels.from'), $t('filterLabels.to')]"
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
		</v-details>

		<v-details
			:title="$t('filterLabels.condition')"
			:open="true"
		>
			<v-switch
				ref="condition"
				type="checkbox"
				name="condition"
				:value="['used', 'new']"
				:label="[$t('filterLabels.used'), $t('filterLabels.new')]"
				@change="changeCondition"
			/>
		</v-details>

		<!-- <v-details
			:title="$t('type.label')"
			:open="true"
		>
			<div class="row">
				<v-switch
					id="gaming_notebook"
					type="checkbox"
					:label="$t('type.gaming_notebook')"
				/>
			</div>

			<div class="row">
				<v-switch
					id="notebook"
					type="checkbox"
					:label="$t('type.notebook')"
				/>
			</div>

			<div class="row">
				<v-switch
					id="notebook_tablet"
					type="checkbox"
					:label="$t('type.notebook_tablet')"
				/>
			</div>

			<div class="row">
				<v-switch
					id="transformer"
					type="checkbox"
					:label="$t('type.transformer')"
				/>
			</div>
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