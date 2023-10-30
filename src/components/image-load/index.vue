<template>
	<div class="image">
		<slot v-if="$slots.image && image" name="image"></slot>
		<slot v-if="$slots.loader && loader" name="loader"></slot>
		<slot v-if="$slots.error && error" name="error"></slot>
	</div>
</template>

<script src="./index.js"></script>