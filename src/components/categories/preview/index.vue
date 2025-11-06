<template>
	<div class="categories-preview-carousel">
		<carousel>
			<slide
				v-for="(groupedItem, index) in groupedList()"
				:key="groupedItem.map(m => m.key).join('_')"
			>
				<PreviewSlide
					:groupedItem="groupedItem"
				/>
			</slide>
		</carousel>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>