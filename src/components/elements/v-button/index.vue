<template>
	<div
		:class="{
			'v-button-holder': true,
			'has-dropdown': hasDropdown,
			'dropdown-open': active
		}"
	>
		<slot name="before"></slot>

		<button
			:class="{
				'v-button': true,
				'v-button-right': align === 'right',
				[`v-button-${ type ?? 'primary' }`]: true,
				[`v-button-${ size ?? 'md' }`]: true,
				active
			}"
			ref="button"
			@click="clickButton"
		>
			<slot></slot>
			<i class="fa fa-angle-down v-dropdown-arrow" v-if="hasDropdown"></i>
		</button>

		<div class="v-button-dropdown" v-if="hasDropdown">
			<slot name="dropdown" v-if="$slots.dropdown"></slot>
			
			<ul v-else>
				<li
					v-for="(item, index) in dropdown"
					:key="index"
					@click="$event => clickItem($event, item, index)"
				>
					<span>{{ item[dropdownItemKey] || item.text || item }}</span>
				</li>
			</ul>
		</div>

		<slot name="after"></slot>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>