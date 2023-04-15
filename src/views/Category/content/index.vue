<template>
	<ContentLayout>
		<v-select type="stroke">
			<i class="fa fa-sort-amount-up"></i>
			<span>New first</span>
			<div class="fa fa-angle-down"></div>
		</v-select>
		<BarterList
			:items="barters.slice(0, 8)"
		/>
	</ContentLayout>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>