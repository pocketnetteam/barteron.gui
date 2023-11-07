<template>
	<form action="#" class="search-bar">
		<CategorySelect
		ref="categorySelect"
		value=""
		@selected="selected"
		/>
		<v-button
			vType="hit"
			@click="$refs.categorySelect.show()"
		>{{ $t('buttonLabels.categories') }}</v-button>
		
		<div class="text-field">
			<input type="text" placeholder="Search on Barteron">
		</div>
		
		<v-button
			class="btn-search"
			vType="hit"
			vSize="md"
		>
			<i class="fa fa-search"></i>
		</v-button>
	</form>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>