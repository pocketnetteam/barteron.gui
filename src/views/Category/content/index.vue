<template>
	<ContentLayout>
		<div class="row">
			<v-select
				type="stroke"
				:dropdown="[{ text: $t('filterLabels.new'), value: 'new', default: true }]"
			>
				<i class="fa fa-sort-amount-up icon"></i>
				<span>{{ $t('filterLabels.new') }}</span>
				<div class="fa fa-angle-down"></div>
			</v-select>
		</div>

		<BarterList
			:items="barters.slice(0, 8)"
		/>
	</ContentLayout>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>