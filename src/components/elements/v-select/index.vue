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
			class="v-hidden"
			:id="id"
			:name="name"
			ref="select"
		>
			<slot
				name="dropdown"
				v-if="$slots.dropdown"
			></slot>
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
			v-if="dropdown"
		>
			<ul v-if="!$slots.dropdown">
				<li
					v-for="(item, index) in items"
					:key="index"
					@click="$event => clickItem($event, item, index)"
				>
					<span>{{ item[dropdownValueKey] || item.text || item }}</span>
				</li>
			</ul>
		</div>
		
		<slot name="after"></slot>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>