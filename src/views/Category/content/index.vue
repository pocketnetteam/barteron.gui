<template>
	<v-content>
		<div class="row">
			<div class="col no-offset">
				<v-select
					ref="order"
					:dropdown="orders.map(order => ({
						text: `
							<i class='fa icon ${ 
								(() => {
									switch (order.value) {
										case 'height_asc': return 'fa-sort-alpha-up-alt';
										case 'height_desc': return 'fa-sort-alpha-down';
										case 'price_asc': return 'fa-sort-numeric-down';
										case 'price_desc': return 'fa-sort-numeric-up-alt';
									}
								})()
							}'></i>
							${ $t(`orderLabels.${ order.value }`) }
						`,
						value: order.value
					}))"
					@selected="selectOrderEvent"
				/>
			</div>

			<div class="col right">
				<v-select
					ref="bartersView"
					:dropdown="views.map(view => ({
						text: `
							<i class='fa icon ${ 
								(() => {
									switch (view.value) {
										case 'tile': return 'fa-th-large';
										case 'row': return 'fa-align-justify';
									}
								})()
							}'></i>
							${ $t(`viewLabels.${ view.value }`) }
						`,
						value: view.value
					}))"
					@selected="selectViewEvent"
				/>
			</div>
		</div>

		<div class="row category-holder">
			<BarterList
				:items="items"
				:vType="bartersView"
				v-if="items?.length"
			/>
			<loader 
				v-else-if="items?.length == 0 && isLoading" 
				type="circular" 
			/>
			<p v-else>{{ $t('categoryLabels.empty') }}</p>
		</div>

		<div class="row center">
			<v-button
				v-if="!(isLoading) && items?.length && !(allItemsAreLoaded)"
				@click="showMoreEvent"
			>{{ $t('buttonLabels.show_more') }}</v-button>
			<loader 
				v-else-if="items?.length && isLoading" 
				type="circular" 
			/>
		</div>

		<v-dialog ref="dialog" />
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>