<template>
	<dialog
		:class="{
			'v-lightbox': true,
			'v-lightbox-open': active,
			[`v-lightbox-${ size ?? 'md' }`]: true
		}"
		:open="active"
		@click="overlay"
	>
		<slot name="before" v-if="$slots.before"></slot>
		<section @click.stop="() => {}">
			<header
				class="v-lightbox-header"
				ref="header"
			>
				<template>
					<div class="title">
						<h1>{{ title }}</h1>

						<v-button
							class="v-lightbox-close"
							vType="light"
							:disabled="closeButtonDisabled"
							@click="hide"
							v-if="close"
						>
							<i class="fa fa-times"></i>
						</v-button>
					</div>
				</template>
				<slot name="header" v-if="$slots.header"></slot>
			</header>

			<main
				v-if="$slots.default"
				ref="main"
			>
				<div class="v-lightbox-content">
					<slot></slot>
				</div>
			</main>

			<footer
				class="v-lightbox-footer"
				ref="footer"
				v-if="$slots.footer"
			>
				<slot name="footer"></slot>
			</footer>
		</section>
		<slot name="after"></slot>
	</dialog>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>