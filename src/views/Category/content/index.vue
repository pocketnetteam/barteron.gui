<template>
	<ContentLayout>
		<div class="row">
			<v-select type="stroke" @selected="selectFilter">
				<template>
					<span class="value"></span>
				</template>

				<template v-slot:dropdown>
					<option
						v-for="(filter, index) in filters"
						:key="index"
						:value="filter.value"
					>
						<i
							:class="{
								'fa': true,
								'fa-sort-amount-up': filter.value === 'new',
								'fa-sort-amount-up-alt': filter.value === 'old',
								'fa-sort-numeric-down': filter.value === 'price_asc',
								'fa-sort-numeric-down-alt': filter.value === 'price_desc',
								'icon': true
							}"
						></i>
						{{ $t(`filterLabels.${ filter.value }`) }}
					</option>
				</template>
			</v-select>
		</div>

		<BarterList
			:items="barters.slice(0, 8)"
		/>
	</ContentLayout>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>