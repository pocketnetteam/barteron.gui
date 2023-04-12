<template>
	<dialog
		:class="{
			'v-lightbox': true,
			'v-lightbox-open': active,
			[`v-lightbox-${ size ?? 'md' }`]: true
		}"
		:open="active"
		@click="overlayClick"
	>
		<slot name="before"></slot>
		<section @click.stop="() => {}">
			<header class="v-lightbox-header" v-if="header !== false">
				<slot name="header" v-if="$slots.header"></slot>
				<template v-else>
					<h1>{{ title }}</h1>
					<i
						class="fa fa-times v-lightbox-close"
						@click="hide"
						v-if="closeButton"
					></i>
				</template>
			</header>

			<main>
				<div class="v-lightbox-content">
					<slot></slot>
				</div>
			</main>

			<footer class="v-lightbox-footer" v-if="footer !== false">
				<slot name="footer" v-if="$slots.footer"></slot>
				<template v-else>
					FOOTER
				</template>
			</footer>
		</section>
		<slot name="after"></slot>
	</dialog>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>