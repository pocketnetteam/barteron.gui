<template>
	<form ref="form">
		<fieldset>
			<slot name="default" :form="form"></slot>
		</fieldset>
	</form>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>