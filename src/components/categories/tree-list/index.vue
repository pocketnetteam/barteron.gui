<template>
	<ul :class="{ 'children-open': subOpened.length }">
		<li
			v-for="(item, i) in items"
			:key="item.id"
			:class="{
				'tree-item': true,
				'has-dropdown': item.children.length,
				'dropdown-open': item.active,
			}"
			@click="$event => selectItem($event, item, i)"
		>
			<span
				:class="{
					'text': true,
					'text-hidden': item.active && item.children.filter(f => f.active).length
				}"
			>
				<i
					:class="`fa ${ !item.active ? (item.icon ? `${ item.icon } category-icon` : '') : ('fa-angle-left') }`"
					v-if="item.active || item.icon"
				></i>
				<span>
					<template v-if="item.active && item.children.length">
						{{
							`${ parents.map(p => $t(p.name)).join(" &raquo; ") }${ parents.length ? " &raquo; " : "" }`
						}}
					</template>
					{{ $t(item.name) }}
				</span>
				<i
					class="fa fa-angle-right"
					v-if="!item.active && item.children.length"
				></i>
			</span>

			<TreeList
				v-if="item.active && item.children.length"
				:items="item.children"
				:parents="parentsList(item)"
				@selectItem="selectItem"
			/>
		</li>
	</ul>
</template>

<script src="./index.js"></script>