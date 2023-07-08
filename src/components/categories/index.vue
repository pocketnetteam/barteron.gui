<template>
	<v-button
		class="btn-categories"
		vAlign="right"
		@click="categoriesToggle"
	>
		<template #before>
			<div :class="{
				'overlay': true,
				'active': overlay
			}"></div>
		</template>

		<i class="fa fa-caret-down"></i>
		<span>{{ $t("buttonLabels.categories") }}</span>

		<template #dropdown>
			<TreeList
				v-if="items.length"
				:items="items"
				@itemSelected="categorySelected"
			/>
		</template>
	</v-button>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>