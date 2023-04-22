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
				'v-button-right': vAlign === 'right',
				[`v-button-${ vType ?? 'primary' }`]: true,
				[`v-button-${ vSize ?? 'md' }`]: true,
				active
			}"
			ref="button"
			@click="clickButton"
		>
			<router-link
				v-if="to"
				class="link"
				:to="to"
			>
				<slot></slot>
			</router-link>
			
			<slot v-else></slot>

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