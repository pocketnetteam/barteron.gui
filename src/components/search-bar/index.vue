<template>
	<form action="#" class="search-bar">
		<CategorySelect
			ref="categorySelect"
			:marked="[id]"
			:value="id"
			@selected="selected"
		/>
		<v-button
			vType="light"
			@click="$refs.categorySelect.show()"
		>{{ $t('buttonLabels.categories') }}</v-button>
		
		<div class="text-field">
			<input
				type="text"
				:placeholder="$t(
					`searchLabels.${ id && id !== 'search' ? 'category' : 'global' }`,
					{ category: $t(categories.items[id]?.name || 'categoryLabels.label') })
				"
				v-model="query"
				@keyup.enter="submit"
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