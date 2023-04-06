<template>
	<div id="content">
		<AssocList :items="categories" />

		<section>
			<h1>New from goods</h1>
			<BarterCarousel
				:items="barters"
				:carousel="true"
			/>
		</section>

		<section>
			<h1>Services</h1>
			<BarterCarousel
				:items="barters"
			/>
		</section>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>