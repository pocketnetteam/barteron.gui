<template>
	<div>
		<Breadcrumbs parent="home" />

		<h1>
			{{ $t(`${ $te(title) ? '' : 'pageLabels.' }${ title }`) }}
			<span class="count">207 ads</span>
		</h1>

		<SubCategories :items="subCategories" />
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>