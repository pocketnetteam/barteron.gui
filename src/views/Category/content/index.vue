<template>
	<v-content>
		<div class="row">
			<div class="col">
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

			<div class="col right">
				<v-select type="stroke" @selected="selectView">
					<template>
						<span class="value"></span>
					</template>
	
					<template v-slot:dropdown>
						<option
							v-for="(view, index) in views"
							:key="index"
							:value="view.value"
						>
							<i
								:class="{
									'fa': true,
									'fa-th-large': view.value === 'tails',
									'fa-align-justify': view.value === 'rows',
									'icon': true
								}"
							></i>
							{{ $t(`viewLabels.${ view.value }`) }}
						</option>
					</template>
				</v-select>
			</div>
		</div>

		<BarterList
			:items="barters.slice(0, 8)"
		/>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>