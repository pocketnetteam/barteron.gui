<template>
	<nav class="sub-categories-list">
		<menu>
			<template
				v-for="(item, index) in items"
			>
				<menuitem
					v-if="!expanded && index < visible || expanded"
					:key="index"
				>
					<router-link :to="{ name: 'category', params: { id: item.id } }">
						{{ $t(item.name) }}
					</router-link>
				</menuitem>
			</template>
		</menu>

		<button
			v-if="count > 0"
			class="toggle"
			@click="toggle"
		>
			<template v-if="!expanded">
				{{ $t('toggle.show_all') }} ({{ count }})
			</template>
			<template v-else>
				<div>
					{{ $t('toggle.hide') }}
				</div>
			</template>
		</button>
	</nav>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>