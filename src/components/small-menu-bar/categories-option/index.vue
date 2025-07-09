<template>
	<div>
		<CategorySelect
			ref="categorySelect"
			:marked="[id]"
			:value="id"
			@selected="selected"
		/>
		<v-button
			id="show-categories-button"
			@click="$refs.categorySelect.show()"
		>
			<i class="fa fa-list"></i>
		</v-button>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>