<template>
	<div :class="{
		'v-switch-holder': true,
		[`v-switch-${ vType }`]: vType,
		[`v-switch-${ vSize ?? 'md' }`]: true
	}">
		<slot name="before"></slot>

		<div
			v-for="(sw, index) in switches"
			:key="index"
			class="v-switch-input"
		>
			<input
				ref="fields"
				:id="sw.id"
				:name="sw.name || sw.id"
				:type="sw.type"
				:value="sw.value"
				:checked="sw.checked"
				v-model="active"
				@change="change"
			/>
			<div class="v-switch">
				<slot name="controlBefore" :index="index"></slot>
				<span class="v-control"></span>
				<label v-if="sw.label" :for="sw.id || sw.name">{{ sw.label }}</label>
				<slot name="controlAfter" :index="index"></slot>
			</div>
		</div>

		<slot name="after"></slot>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>