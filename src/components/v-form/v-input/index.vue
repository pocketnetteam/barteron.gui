<template>
	<div :class="{
		'v-input-holder': true,
		[`v-input-${ vSize ?? 'md' }`]: true
	}">
		<slot name="before"></slot>

		<div
			v-for="(input, index) in inputs"
			:key="index"
			class="v-input"
		>
			<slot :name="`input${ index }Before`"></slot>
			<input
				:id="input.id"
				:name="input.name"
				:type="input.type"
				:min="input.min"
				:max="input.max"
				:placeholder="input.placeholder"
				:value="input.value"
			/>
			<slot :name="`input${ index }After`"></slot>
		</div>

		<slot name="after"></slot>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>