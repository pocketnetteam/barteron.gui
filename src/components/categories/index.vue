<template>
	<v-button
		class="btn-categories"
		align="right"
		@click="categoriesToggle"
	>
		<template v-slot:before>
			<div :class="{
				'overlay': true,
				'active': overlay
			}"></div>
		</template>

		<i class="fa fa-caret-down"></i>
		<span>Categories</span>

		<template v-slot:dropdown>
			<TreeList
				v-if="categories.length"
				:items="items"
				@itemSelected="categorySelected"
			/>
		</template>
	</v-button>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>