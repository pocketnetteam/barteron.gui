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
				ref="fields"
				:id="input.id"
				:name="input.name"
				:type="input.type"
				:readonly="input.readonly"
				:min="input.min"
				:max="input.max"
				:placeholder="input.placeholder"
				v-model="input.value"
				@change="$event => emit('change', $event, index)"
				@input="$event => emit('input', $event, index)"
				@cut="$event => emit('cut', $event, index)"
				@copy="$event => emit('copy', $event, index)"
				@paste="$event => emit('paste', $event, index)"
			/>
			<slot :name="`input${ index }After`"></slot>
		</div>

		<slot name="after"></slot>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>