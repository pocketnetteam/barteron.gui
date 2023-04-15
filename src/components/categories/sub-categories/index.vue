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
					<router-link :to="{ name: 'category', params: { slug: item.name } }">
						{{ $t(item.name) }}
					</router-link>
				</menuitem>
			</template>
		</menu>

		<span
			v-if="count"
			class="toggle"
			@click="toggle"
		>
			{{ `${ $t(expanded ? 'hide' : 'showAll') } (${ count })` }}
		</span>
	</nav>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>