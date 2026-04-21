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
				<img
					v-if="isTopCategory(item)"
					class="image top-category"
					:style="{ 'padding': getPadding(item) }"
					:src="imageUrl(`categories-preview/${item.key}.png`)"
				>
				<img
					v-else-if="isSubcategory(item)"
					class="image subcategory"
					:style="{ 'padding': '15px' }"
					:src="imageUrl(`categories-preview/subcategory.png`)"
				>
				<div 
					v-else 
					class="action"
				>
					<i :class="`fa ${item.icon}`"></i>
				</div>
			</div>
			<div class="title">
				<span :title="item.previewTitle">{{ item.previewTitle }}</span>
			</div>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>