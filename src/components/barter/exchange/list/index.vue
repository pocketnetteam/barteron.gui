<template>
	<div class="exchange">
		<strong class="title">{{ $t('barterLabels.to') }}:</strong>

		<!-- Tags -->
		<ul class="list">
			<li v-for="(tag, index) in tags.slice(0, show)" :key="index">{{ tag }}</li>
		</ul>

		<!-- Toggle -->
		<div class="toggle">
			<a href="#" class="link" @click.prevent="toggle">
				{{ $t(`toggle.${ show < tags.length ? 'show' : 'hide' }_all`) }}
			</a>
		</div>

		<!-- Tags edit -->
		<div class="edit" v-if="$slots.edit">
			<slot name="edit"></slot>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>