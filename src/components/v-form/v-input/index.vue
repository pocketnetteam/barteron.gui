<template>
	<div class="v-input-holder">
		<slot name="before"></slot>

		<div
			v-for="(input, index) in inputs"
			:key="index"
			class="v-input"
		>
			<input
				:id="input.id"
				:name="input.name"
				:type="input.type"
				:min="input.min"
				:max="input.max"
				:placeholder="input.placeholder"
				:value="input.value"
			/>
		</div>

		<slot name="after"></slot>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>