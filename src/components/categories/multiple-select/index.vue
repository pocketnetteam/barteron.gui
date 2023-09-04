<template>
	<div class="categories-multiple-select">
		<div class="categories-select-holder">
			<div
				v-for="(list, index) in tree"
				:key="index"
				class="category-select"
			>
				<datalist :id="`category-select-${ id }-${ index }`">
					<option
						v-for="(item, i) in list"
						:key="i"
						:data-value="item.name"
					>{{ $t(item.name) }}</option>
				</datalist>

				<input
					type="text"
					:list="`category-select-${ id }-${ index }`"
					:placeholder="$t('choose_category')"
					ref="category"
					@input="$event => validate($event, index)"
				>

				<i
					:class="{
						'fa fa-times remove': true,
						'disabled': !values[index]
					}"
					@click="() => remove(index)"
				></i>
			</div>
		</div>

		<input
			ref="input"
			:name="name"
			type="hidden"
		>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>