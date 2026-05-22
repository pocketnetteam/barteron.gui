<template>
	<form action="#" class="search-bar" @keydown.enter.prevent> <!-- need add @keydown.enter.prevent to prevent category selection dialog by enter -->
		<v-button
			id="show-categories-button"
			@click="showCategorySelectDialog"
		>
			<i class="fa fa-bars"></i>
			<span>{{ $t('buttonLabels.categories') }}</span>
		</v-button>
		
		<div class="text-field">
			<input
				type="text"
				:placeholder="$t(
					`searchLabels.${ id && id !== 'search' ? 'category' : 'global' }`,
					{ category: $t(categories.items[id]?.name || 'categoryLabels.label') })
				"
				v-model="query"
				@keyup.enter.stop="submit"
			>
		</div>
		
		<v-button
			class="btn-reset"
			vType="transparent light-color"
			vSize="md"
			v-show="query"
			@click="reset"
		>
			<i class="fa fa-times"></i>
		</v-button>

		<v-button
			class="btn-search"
			vType="light"
			vSize="md"
			:disabled="!query"
			@click="submit"
		>
			<i class="fa fa-search"></i>
		</v-button>
	</form>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>