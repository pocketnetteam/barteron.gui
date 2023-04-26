<template>
	<div :class="{
		'v-textarea-holder': true,
		[`v-textarea-${ vSize ?? 'md' }`]: true
	}">
		<slot name="before"></slot>

		<textarea
			:id="id"
			:name="name"
			:readonly="readonly"
			:placeholder="placeholder"
			:class="{
				'no-resize': !resize,
				'text-counter': length
			}"
			ref="textarea"
			v-model="content"
		></textarea>
		<span class="counter" v-if="length">{{ count }} / {{ length }}</span>

		<slot name="after"></slot>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>