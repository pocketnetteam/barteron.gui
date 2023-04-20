<template>
	<v-aside>
		<v-details
			:title="$t('category')"
			:open="true"
		>
			<SubCategories :items="subCategories" />
		</v-details>

		<v-details
			:title="$t('price')"
			:open="true"
		>
			
		</v-details>
	</v-aside>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>