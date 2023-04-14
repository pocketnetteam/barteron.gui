<template>
	<form action="#" class="search-bar">
		<Categories
			:categories="categories.items"
			@categorySelected="categorySelected"
		/>
		
		<div class="text-field">
			<input type="text" placeholder="Search on Barteron">
		</div>
		
		<v-button
			class="btn-search"
			size="md"
		>
			<i class="fa fa-search"></i>
		</v-button>
	</form>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>