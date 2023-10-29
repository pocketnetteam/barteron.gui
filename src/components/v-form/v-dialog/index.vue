<template>
	<transition name="fade" mode="in-out">
		<div class="v-dialog" v-show="visible">
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
		</div>
	</transition>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>