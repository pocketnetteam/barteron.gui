<template>
	<div class="sticker-list">
		<div class="sticker-list-carousel">
			<carousel ref="carousel">
				<slide
					v-for="itemId in stickerList()"
					:key="itemId"
					class="fixed-layout"
				>
					<StickerSlide
						:itemId="itemId"
						@action="stickerAction"
					/>
				</slide>
			</carousel>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>