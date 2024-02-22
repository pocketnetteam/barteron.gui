<template>
	<div :class="{
		'v-input-holder': true,
		[`v-input-${ vSize ?? 'md' }`]: true
	}">
		<slot name="before"></slot>

		<div
			v-for="(attr, index) in attrs"
			:key="index"
			:class="{ 'v-input': true, [`v-input-${ attr.type }`]: attr.type }"
		>
			<slot :name="`input${ index }Before`"></slot>
			<input
				ref="fields"
				v-bind="attr"
				v-model="attrs[index].value"
				v-on="vEvents"
			/>
			<template v-if="attr.type === 'range' && !$slots[`input${ index }After`]">
				<div class="controls">
					<button
						class="increment"
						@click.prevent="increment(index)"
						@mousedown="mouseDown(() => increment(index), 100)"
						@mouseup="mouseUp"
						@mouseleave="mouseUp"
					>
						<i class="fa fa-chevron-up"></i>
					</button>
					<button
						class="decrement"
						@click.prevent="decrement(index)"
						@mousedown.prevent="mouseDown(() => decrement(index), 100)"
						@mouseup="mouseUp"
						@mouseleave="mouseUp"
					>
						<i class="fa fa-chevron-down"></i>
					</button>
				</div>
			</template>
			<slot :name="`input${ index }After`"></slot>
		</div>

		<slot name="after"></slot>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>