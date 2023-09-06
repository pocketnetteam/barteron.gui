<template>
	<div :class="{ 'exchange': true, [`v-list-${ vSize }`]: true }">
		<strong class="title" v-if="title">{{ $t('barterLabels.to') }}:</strong>

		<slot v-if="$slots.default || $scopedSlots.default" :instance="instance"></slot>

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
			>
				<datalist :id="`categories-${ id }`" ref="list">
					<option
						v-for="(item, index) in list[list.length - 1]"
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
					:list="`categories-${ id }`"
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

		<!-- Tags edit -->
		<div class="edit" v-if="$slots.edit || $scopedSlots.edit">
			<slot name="edit" :instance="instance"></slot>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>