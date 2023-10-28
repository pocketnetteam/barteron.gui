<template>
	<div class="overlay" v-if="loading">
		<div
			:class="{
				'loader': true,
				[`type-${ type }`]: type
			}"
		>
			<template v-if="type === 'main'">
				<div class="holder"></div>
				<div class="circle">
					<div class="straight"></div>
					<div class="curve"></div>
				</div>
			</template>
		</div>
	</div>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>