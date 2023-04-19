<template>
	<details
		:class="{ 'v-details': true }"
		:open="open"
	>
		<summary>{{ title }}</summary>
		<slot></slot>
	</details>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>