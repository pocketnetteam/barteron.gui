<template>
	<nav class="breadcrumbs">
		<menu>
			<menuitem
				v-for="(item, index) in tree"
				:key="index"
			>
				<template v-if="lastActive || index < tree.length - 1">
					<router-link :to="item.link">{{ item.value }}</router-link>
				</template>
				<template v-else>{{ item.value }}</template>
			</menuitem>
		</menu>
	</nav>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>