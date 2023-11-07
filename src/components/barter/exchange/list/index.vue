<template>
	<div :class="{ 'exchange': true, [`v-list-${ vSize }`]: true }">
		<strong class="title" v-if="title">{{ $t('barterLabels.to') }}:</strong>

		<slot v-if="$slots.default || $scopedSlots.default" :instance="instance"></slot>

		<!-- Tags -->
		<ul class="list">
			<li
				v-for="(id, index) in !editable ? vTags.slice(0, show) : vTags"
				:key="index"
			>
				{{ $te(categories.items[id]?.name) ? $t(categories.items[id]?.name) : tag }}
				<i
					v-if="editable"
					class="fa fa-times remove"
					@click="remove(index)"
				></i>
			</li>

			<!-- Empty list -->
			<li class="empty" v-if="!vTags.length">
				{{ $t('exchange.empty') }}
			</li>

			<!-- Toggle list -->
			<li class="toggle" v-if="!editable && vTags.length > visible">
				<a
					class="link"
					href="#"
					@click.prevent="toggle"
				>
					{{ $t(`toggle.${ show < vTags.length ? 'show' : 'hide' }_all`) }}
				</a>
			</li>

			<!-- Insert tag -->
			<li
				v-if="($slots.edit || $scopedSlots.edit) && editable"
				class="add"
				@click="$refs.categorySelect.show()"
			>
				<i class="fa fa-plus"></i>
			</li>
		</ul>

		<CategorySelect
			ref="categorySelect"
			:marked="vTags"
			@selected="insert"
		/>

		<!-- Tags edit -->
		<div class="edit" v-if="$slots.edit || $scopedSlots.edit">
			<slot name="edit" :instance="instance"></slot>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>