<template>
	<div
		:class="{
			'overlay': true,
			[`type-${ type }`]: type,
			[`align-${ align }`]: align,
		}"
		v-if="loading"
	>
		<div class="loader">
			<template v-if="type === 'main'">
				<div class="holder"></div>
				<div class="circle">
					<div class="straight"></div>
					<div class="curve"></div>
				</div>
			</template>

			<template v-if="type === 'offer-tile'">
				<div class="loader-image"></div>
				<div class="loader-text loader-text-controls"></div>
				<div class="loader-text"></div>
				<div class="loader-text"></div>
				<div class="loader-text"></div>
			</template>
		</div>
	</div>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>