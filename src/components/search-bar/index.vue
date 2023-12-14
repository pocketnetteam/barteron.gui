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
					`searchLabels.${ id ? 'category' : 'global' }`,
					{ category: $t(categories.items[id]?.name || 'category.label') })
				"
			>
		</div>
		
		<v-button
			class="btn-search"
			vType="light"
			vSize="md"
		>
			<i class="fa fa-search"></i>
		</v-button>
	</form>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>