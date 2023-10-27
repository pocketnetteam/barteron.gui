<template>
	<div class="v-dialog" v-show="visible">
		<transition name="fade" mode="in-out">
			<section class="content">
				<main>
					<i :class="`icon color-${ iconColor } fa ${ icon }`"></i>
					<p :class="`text color-${ textColor }`">{{ text }}</p>
				</main>
				<footer v-if="buttons?.length">
					<v-button
						v-for="(button, index) in buttons"
						:key="index"
						:vType="button.vType"
						:vSize="button.vSize"
						@click="button.click"
					>{{ button.text }}</v-button>
				</footer>
			</section>
		</transition>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>