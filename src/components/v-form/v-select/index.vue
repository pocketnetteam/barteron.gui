<template>
	<div
		:class="{
			'v-select-holder': true,
			'dropdown-open': active
		}"
	>
		<slot name="before"></slot>

		<select
			:id="id"
			:name="name"
			:class="{
				'v-hidden': true,
				[`v-select-${ vSize ?? 'md' }`]: true
			}"
			ref="select"
		>
			<slot name="dropdown" v-if="$slots.dropdown"></slot>
		</select>

		<button
			:class="{
				'v-select': true,
				'v-select-right': vAlign === 'right',
				[`v-select-${ vType ?? 'primary' }`]: true,
				[`v-select-${ vSize ?? 'md' }`]: true,
				active
			}"
			ref="button"
			@click="clickSelect"
		>
			<slot v-if="$slots.default"></slot>
			<span
				class="value"
				ref="value"
				v-else
			></span>
			<i class="fa fa-angle-down v-dropdown-arrow" v-if="items.length"></i>
		</button>

		<div class="v-select-dropdown" v-if="items.length">
			<ul>
				<li
					v-for="(item, index) in items"
					:key="index"
					:class="{
						'selected': selected === item,
						'hidden': !item.value
					}"
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