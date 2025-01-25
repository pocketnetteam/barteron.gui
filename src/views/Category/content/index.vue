<template>
	<v-content v-if="!(isEmptyListFromFullSearch())">
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
			<div 
				v-if="!(isLoading) && items?.length && !(allItemsAreLoaded)"
				v-intersection="showMoreEvent" 
				style="width: 100%; height: 20px;"
	        />
			<loader 
				v-else-if="items?.length && isLoading" 
				type="circular" 
			/>
		</div>
	</v-content>

	<v-content v-else>
		<section>
			<p>{{ $t('categoryLabels.empty') }}</p>
			<i18n
				path="categoryLabels.empty_details"
				tag="p"
			>
				<template #all_regions>
					<v-button
						@click="reset"
					>{{ $t('buttonLabels.all_regions') }}</v-button>
				</template>
			</i18n>
		</section>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>