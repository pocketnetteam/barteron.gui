<template>
	<form class="v-form" ref="form">
		<fieldset>
			<slot name="default" :form="form"></slot>
		</fieldset>

		<div class="popup" v-show="popup.visible">
			<transition name="fade" mode="in-out">
				<div class="content">
					<i :class="`icon ${ popup.icon }`"></i>
					<p class="text">{{ popup.text }}</p>
				</div>
			</transition>
		</div>
	</form>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>