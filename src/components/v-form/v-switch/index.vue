<template>
	<div :class="{
		'v-switch-holder': true,
		[`v-switch-${ vType }`]: vType,
		[`v-switch-${ vSize ?? 'md' }`]: vSize
	}">
		<slot name="before"></slot>

		<input
			ref="input"
			:id="id"
			:name="name || id"
			:type="type"
			:value="value"
			:checked="checked"
		/>
		<div class="v-switch">
			<span class="v-control"></span>
			<label v-if="label" :for="id || name">{{ label }}</label>
		</div>

		<slot name="after"></slot>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>