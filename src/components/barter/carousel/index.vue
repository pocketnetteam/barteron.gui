<template>
	<div
		:class="{
			'barter-carousel': true
		}"
	>
		<div class="barter-carousel-holder">
			<ul>
				<li
					v-for="(item, index) in items"
					:key="index"
				>
					<BarterItem :item="item" />
				</li>
			</ul>
		</div>

		<div class="barter-carousel-controls">
			<div class="barter-carousel-prev">
				<i class="fa fa-angle-left"></i>
			</div>
			<div class="barter-carousel-next">
				<i class="fa fa-angle-right"></i>
			</div>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>