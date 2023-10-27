<template>
	<form class="v-form" ref="form">
		<fieldset>
			<slot name="default" :form="form"></slot>
		</fieldset>

		<v-dialog ref="dialog" />
	</form>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>