<template>
	<div id="content">
		<AssocList :items="categories" />

		<section>
			<h1>New from goods</h1>
			<BarterList
				:items="barters"
				:carousel="true"
			/>
		</section>

		<Banner>
			<picture>
				<img :src="require('@/assets/images/banner.jpeg')" alt="banner">
			</picture>
		</Banner>

		<section>
			<h1>Services</h1>
			<BarterList
				:items="barters.slice(0, 8)"
			/>
		</section>

		<section>
			<h1>Viewed</h1>
			<BarterList
				:items="barters.slice(0, 4)"
			/>
		</section>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>