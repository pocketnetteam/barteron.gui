<template>
	<div class="categories-preview">
		<h1 class="title">{{ $t('offer_categories') }}</h1>
		<div class="categories-preview-carousel">
			<carousel ref="carousel">
				<slide
					v-for="(groupedItem, index) in groupedList()"
					:key="groupedItem.map(m => m.key).join('_')"
					class="fixed-layout"
				>
					<PreviewSlide
						:groupedItem="groupedItem"
						@selectItem="selectItem"
					/>
				</slide>
			</carousel>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>