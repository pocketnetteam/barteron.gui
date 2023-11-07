<template>
	<div :class="{
		'v-input-holder': true,
		[`v-input-${ vSize ?? 'md' }`]: true
	}">
		<slot name="before"></slot>

		<div
			v-for="(attr, index) in attrs"
			:key="index"
			class="v-input"
		>
			<slot :name="`input${ index }Before`"></slot>
			<input
				ref="fields"
				v-bind="attr"
				v-model="attr.value"
				v-on="vEvents"
			/>
			<slot :name="`input${ index }After`"></slot>
		</div>

		<slot name="after"></slot>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>