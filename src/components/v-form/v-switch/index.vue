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
			<slot name="controlBefore" :index="index"></slot>
			<input
				ref="fields"
				:id="sw.id"
				:name="sw.name || sw.id"
				:type="sw.type"
				:value="sw.value"
				:disabled="sw.disabled"
				v-model="active"
				@change="change"
			/>
			<div class="v-switch">
				<span 
					class="v-control"
					:class="{'disabled': sw.disabled}"
				></span>
				<img
					v-if="sw.image"
					class="label-image"
					:src="sw.image.src" 
					:alt="sw.image.alt"
				>
				<label 
					v-if="sw.label" :for="sw.id || sw.name"
					:class="{'disabled': sw.disabled}"
				>{{ sw.label }}</label>
			</div>
			<slot name="controlAfter" :index="index"></slot>
		</div>

		<slot name="after"></slot>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>