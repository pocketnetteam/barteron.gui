<template>
	<div class="category-field">
		<div
			class="category-field-holder"
			@click="$refs.categorySelect.show()"
		>
			<ul>
				<li
					v-for="(parent, index) in catParents"
					:key="index"
				>
					{{ $t(parent.name) }}
					<i class="fa fa-angle-right" v-if="index"></i>
				</li>

				<li>
					{{ $t(id && categories.items[id]?.name || 'categories.choose') }}
					<i class="fa fa-angle-right"></i>
				</li>
			</ul>

			<i
				:class="{
					'fa fa-times clear': true,
					'disabled': !id
				}"
				@click.stop="clear"
			></i>
		</div>

		<input
			ref="input"
			:name="name"
			:value="id"
			type="hidden"
		>

		<CategorySelect
			ref="categorySelect"
			:marked="[id]"
			:value="id"
			@selected="selected"
		/>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>