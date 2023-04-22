<template>
	<div class="v-switch-holder">
		<slot name="before"></slot>

		<div
			:class="{
				'v-switch': true,
				[`v-switch-${ vSize ?? 'md' }`]: true
			}"
		>
			<input
				:id="id"
				:name="name"
				:type="type"
				:value="value"
			/>
			<span class="v-control"></span>
			<label v-if="label" :for="id">{{ label }}</label>
		</div>

		<slot name="after"></slot>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>