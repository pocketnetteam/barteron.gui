<template>
	<div class="category-header">
		<Breadcrumbs :parent="parent" :target="breadcrumbs" v-if="breadcrumbs" />

		<h1 v-if="title">
			{{ pageTitle }}
			<span class="count" v-if="count">207 ads</span>
		</h1>

		<FavoriteCategories :items="favoriteCategories" v-if="favorite" />
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>