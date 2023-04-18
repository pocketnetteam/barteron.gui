<template>
	<div
		:class="{
			'v-select-holder': true,
			'dropdown-open': active,
			[`v-select-${ size ?? 'md' }`]: true
		}"
	>
		<slot name="before"></slot>

		<select
			:id="id"
			:name="name"
			ref="select"
			class="v-hidden"
		>
			<slot name="dropdown" v-if="$slots.dropdown"></slot>
		</select>

		<button
			:class="{
				'v-select': true,
				'v-select-right': align === 'right',
				[`v-select-${ type ?? 'primary' }`]: true,
				[`v-select-${ size ?? 'md' }`]: true,
				active
			}"
			@click="clickSelect"
		>
			<slot></slot>
			<i class="fa fa-angle-down v-dropdown-arrow" v-if="items.length"></i>
		</button>

		<div class="v-select-dropdown" v-if="items.length">
			<ul>
				<li
					v-for="(item, index) in items"
					:key="index"
					v-html="item[dropdownItemKey] || item.text || item"
					@click="$event => clickItem($event, item, index)"
				></li>
			</ul>
		</div>
		
		<slot name="after"></slot>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>