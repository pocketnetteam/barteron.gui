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
			v-show="false"
			:id="id"
			:name="name"
		>

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
		</button>
		<div
			class="v-select-dropdown"
			v-if="$slots.dropdown || dropdown"
		>
			<slot
				name="dropdown"
				v-if="$slots.dropdown"
			></slot>
		</div>
		<slot name="after"></slot>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>