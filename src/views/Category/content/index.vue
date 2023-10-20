<template>
	<v-content>
		<div class="row">
			<div class="col no-offset">
				<v-select
					:dropdown="filters.map((filter, index) => ({
						text: `
							<i class='fa icon ${ 
								(() => {
									switch (filter.value) {
										case 'new': return 'fa-sort-amount-up';
										case 'old': return 'fa-sort-amount-up-alt';
										case 'price_asc': return 'fa-sort-numeric-down';
										case 'price_desc': return 'fa-sort-numeric-down-alt';
									}
								})()
							}'></i>
							${ $t(`filterLabels.${ filter.value }`) }
						`,
						value: filter.value
					}))"
					@selected="selectFilter"
				/>
			</div>

			<div class="col right">
				<v-select
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
					@selected="selectView"
				/>
			</div>
		</div>

		<BarterList
			:items="barters.generate(8)"
			:vType="bartersView"
		/>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>