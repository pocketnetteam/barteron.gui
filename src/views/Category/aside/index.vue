<template>
	<v-aside>
		<v-details
			v-if="subCategories.length"
			:title="$t('category')"
			:open="true"
		>
			<SubCategories :items="subCategories" />
		</v-details>

		<v-details
			:title="$t('price')"
			:open="true"
		>
			<v-input
				:id="['price_min', 'price_max']"
				:placeholder="[$t('from'), $t('to')]"
				min="0"
				type="minmax"
				vSize="lg"
			/>
		</v-details>

		<v-details
			:title="$t('condition')"
			:open="true"
		>
			
		</v-details>
	</v-aside>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>