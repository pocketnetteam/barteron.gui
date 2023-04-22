<template>
	<v-aside>
		<v-details
			v-if="subCategories.length"
			:title="$t('category.label')"
			:open="true"
		>
			<SubCategories :items="subCategories" />
		</v-details>

		<v-details
			:title="$t('price.label')"
			:open="true"
		>
			<v-input
				:id="['price_min', 'price_max']"
				:placeholder="[$t('price.from'), $t('price.to')]"
				min="0"
				type="minmax"
				vSize="lg"
			/>
		</v-details>

		<v-details
			:title="$t('condition.label')"
			:open="true"
		>
			<div class="row">
				<v-switch
					id="condition_new"
					type="checkbox"
					:label="$t('condition.new')"
				/>
			</div>

			<div class="row">
				<v-switch
					id="condition_used"
					type="checkbox"
					:label="$t('used')"
				/>
			</div>
		</v-details>

		<v-details
			:title="$t('type.label')"
			:open="true"
		>
			<div class="row">
				<v-switch
					id="gaming_notebook"
					type="checkbox"
					:label="$t('gaming_notebook')"
				/>
			</div>

			<div class="row">
				<v-switch
					id="notebook"
					type="checkbox"
					:label="$t('notebook')"
				/>
			</div>

			<div class="row">
				<v-switch
					id="notebook_tablet"
					type="checkbox"
					:label="$t('notebook_tablet')"
				/>
			</div>
		</v-details>
	</v-aside>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>