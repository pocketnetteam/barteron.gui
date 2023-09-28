<template>
	<nav class="breadcrumbs">
		<menu>
			<menuitem
				v-for="(item, index) in tree"
				:key="index"
			>
				<template v-if="index < tree.length - 1">
					<router-link :to="item.link">{{ item.value }}</router-link>
				</template>
				<template v-else>{{ item.value }}</template>

				<template v-if="index > 0">
					<i class="fa fa-angle-right"></i>
				</template>
			</menuitem>
		</menu>
	</nav>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>