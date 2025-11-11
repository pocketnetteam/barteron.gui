<template>
	<div class="categories-preview-slide">
		<div 
			v-for="item in groupedItem"
			:key="item.key"
			class="preview-item"
			@click="selectItem(item)"
		>
			<div 
				:class="{
					'icon': true,
					'subcategory': item.parent,
					[`item-type-${item.type}`]: true,
				}"
			>
				<i :class="`fa ${item.icon}`"></i>
			</div>
			<div 
				class="title"
			>
				<span :title="$t(item.name)">{{ $t(item.name) }}</span>
			</div>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>