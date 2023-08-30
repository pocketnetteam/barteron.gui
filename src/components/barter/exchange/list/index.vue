<template>
	<div class="exchange">
		<strong class="title">{{ $t('barterLabels.to') }}:</strong>

		<!-- Tags -->
		<ul class="list">
			<li
				v-for="(tag, index) in !editable ? vTags.slice(0, show) : vTags"
				:key="index"
			>
				{{ $t(tag) }}
				<i
					v-if="editable"
					class="fa fa-times remove"
					@click="remove(index)"
				></i>
			</li>

			<li v-show="editable" class="add">
				<datalist id="categories" ref="list">
					<option
						v-for="(item, index) in list[listIndex]"
						:key="index"
						:disabled="vTags.includes(item.name)"
						:data-value="item.name"
					>{{ item.value }}</option>
				</datalist>

				<i
					:class="{
						'fa fa-angle-double-left back': true,
						'disabled': btnBackDisabled
					}"
					:title="!btnBackDisabled && $t('exchange.back')"
					@click="back"
				></i>
				<input
					ref="tag"
					type="text"
					list="categories"
					:placeholder="$t('exchange.add')"
					@input="validate"
					@keyup.esc="cancel"
					@keyup.enter="insert"
				>
				<i
					:class="{
						'fa fa-plus insert': true,
						'disabled': btnAddDisabled
					}"
					:title="!btnAddDisabled && $t('exchange.insert')"
					@click="insert"
				></i>
			</li>
		</ul>

		<!-- Toggle -->
		<div class="toggle" v-if="!editable && vTags.length > visible">
			<a href="#" class="link" @click.prevent="toggle">
				{{ $t(`toggle.${ show < vTags.length ? 'show' : 'hide' }_all`) }}
			</a>
		</div>

		<!-- Tags edit -->
		<div class="edit" v-if="$slots.edit || $scopedSlots.edit">
			<slot name="edit" :instance="instance"></slot>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>