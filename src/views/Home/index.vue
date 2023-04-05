<template>
	<div id="content">
		<AssocList :items="categories" />

		<section class="goods">
			<h1>New from goods</h1>
			<BarterCarousel
				:items="barters"
				:carousel="true"
			/>
		</section>
	</div>
</template>

<style lang="sass" scoped src="./index.sass"></style>
<script src="./index.js"></script>