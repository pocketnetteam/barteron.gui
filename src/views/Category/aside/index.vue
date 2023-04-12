<template>
	<AsideLayout>
		<v-details
			:title="$t('category')"
			:open="true"
		>
			<SubCategories :items="subCategories" />
		</v-details>
	</AsideLayout>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>