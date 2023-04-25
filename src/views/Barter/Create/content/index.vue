<template>
	<v-content class="shrink">
		<div class="row">
			<strong class="title">{{ $t('steps.propose') }}</strong>
		</div>

		<div class="row block">
			<label for="title" class="v-label">{{ $t('title') }}</label>
			<v-input id="title" />
		</div>
		
		<div class="row block">
			<label for="category" class="v-label">{{ $t('category.label') }}</label>
			<v-select
				id="category"
				class="full-width"
				:dropdown="[{ text: 'Category', value: 'category' }]"
			/>
		</div>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>