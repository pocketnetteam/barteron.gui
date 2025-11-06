<template>
	<div class="categories-preview-slide">
		<div 
			v-for="item in groupedItem"
			:key="item.key"
			class="preview-item"
		>
			<div class="icon">
				<i :class="`fa ${item.icon}`"></i>
			</div>
			<div class="title">
				<span>{{ $t(item.name) }}</span>
			</div>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>