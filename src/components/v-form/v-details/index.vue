<template>
	<details
		:class="{ 'v-details': true }"
		:open="open"
	>
		<summary>
			<template v-if="!$slots.title">{{ title }}</template>
			<slot v-else name="title"></slot>
		</summary>
		
		<slot name="default"></slot>
	</details>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>