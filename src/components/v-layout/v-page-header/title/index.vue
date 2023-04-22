<template>
	<div class="category-header">
		<Breadcrumbs parent="home" v-if="breadcrumbs" />

		<h1>
			{{ $t(`${ $te(title) ? '' : 'pageLabels.' }${ title }`) }}
			<span class="count" v-if="count">207 ads</span>
		</h1>

		<FavoriteCategories :items="favoriteCategories" v-if="favorite" />
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>