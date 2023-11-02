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
				:id="attr.id"
				:name="attr.name"
				:type="attr.type"
				:readonly="attr.readonly"
				:min="attr.min"
				:max="attr.max"
				:placeholder="attr.placeholder"
				:list="attr.list"
				v-model="attr.value"
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