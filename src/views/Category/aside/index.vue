<template>
	<v-aside
		v-if="!(isEmptyListFromFullSearch())"
		ref="asideCategories"
	>
		<v-details
			v-if="subCategories?.length"
			:title="$t('categoryLabels.label')"
			:open="true"
		>
			<SubCategories :items="subCategories" />
		</v-details>

		<v-details :open="true">
			<template #title>
				<strong class="summary">
					<i class="icon-pkoin"></i>
					<span
						:class="{
							'filter-title': true,
							'filter-enabled': priceFilterEnabled()
						}"
					>{{ $t('priceLabels.label') }}</span>
				</strong>
			</template>

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
						keyup: onKeyUpPrice,
						change: changePrice,
						input: changePrice
					}"
				/>
			</div>

			<div class="row">
				<v-switch
					type="radio"
					name="price"
					:value="['-', '-10', '10-50', '50-100', '100-500', '500-1000', '1000-']"
					:checked="priceVariant"
					:label="[
						$t('priceLabels.no_matter'),
						$t('priceLabels.under', { to: 10 }),
						$t('priceLabels.range', { from: 10, to: 50 }),
						$t('priceLabels.range', { from: 50, to: 100 }),
						$t('priceLabels.range', { from: 100, to: 500 }),
						$t('priceLabels.range', { from: 500, to: 1000 }),
						$t('priceLabels.over', { from: 1000 }),
					]"
					@change="changePriceVariant"
				/>
			</div>
		</v-details>

		<v-details 
			:open="true"
		>
			<template #title>
				<strong class="summary">
					<span
						:class="{
							'filter-title': true,
							'filter-enabled': exchangeOptionsFilterEnabled()
						}"
					>{{ $t('exchangeOptions.label') }}</span>
				</strong>
			</template>

			<div class="row">
				<div>{{ $t('exchangeOptions.description') }}</div>
			</div>

			<ExchangeList
				holderClass="field"
				vSize="md"
				:tags="filters.exchangeOptionsTags"
				:title="false"
				:categorySelectTitle="$t('exchangeOptions.categorySelectTitle')"
				:editable="true"
				:editMode="true"
				@change="exchangeOptionsChange"
			>
				<template #default="{ instance }">
					<input name="tags" type="hidden" :value="instance.vTags.join()">
				</template>

				<template #after="{ instance }">
					<div class="row">

						<!-- Favorite tags -->
						<ul class="favorites">
							<template v-for="(id, index) in [17,38,13,11116]">
								<li
									:key="`favorite-${ index }`"
									v-if="!instance.vTags.includes(id)"
									@click="instance.insert(id)"
								>{{ 
									$t(categories.items[id]?.name) || $t('buttonLabels.unknown') 
								}}<i class="fa fa-plus"></i>
								</li>
							</template>
						</ul>

						<div 
							id="remove-exchange-options"
						>
							<v-button
								vType="stroke"
								@click="removeExchangeOptions"
							>
								<i class="fa fa-trash"></i>
							</v-button>
						</div>

					</div>
				</template>
			</ExchangeList>			

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

		<div class="v-details" id="action-buttons">
			<div class="row">
				<div class="buttons-holder full-width">
					<v-button
						vType="chi-chi"
						:disabled="!(filtersEnabled())"
						@click="resetFilters"
					>{{ $t('buttonLabels.reset') }}</v-button>
					<v-button
						:disabled="applyDisabled"
						@click="applyFilters"
					>{{ $t('buttonLabels.apply') }}</v-button>
				</div>
			</div>
		</div>
	</v-aside>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>