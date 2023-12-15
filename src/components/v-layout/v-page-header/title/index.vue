<template>
	<div class="category-header">
		<Breadcrumbs :type="type" :target="breadcrumbs" :lastActive="lastActive" v-if="breadcrumbs" />

		<h1 v-if="title">
			{{ pageTitle }}
			<span class="count" v-if="count">207 ads</span>
		</h1>

		<p v-if="description">{{ description }}</p>

		<FavoriteCategories :items="favoriteCategories" v-if="favorite" />
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>