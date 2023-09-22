<template>
	<nav class="breadcrumbs">
		<menu>
			<menuitem
				v-for="(match, index) in tree"
				:key="index"
			>
				<template v-if="index < tree.length - 1">
					<router-link :to="{ path: `${ parent ? '/' + parent : '' }/${ match }` }">
						{{ $t($te(match) ? match : `pageLabels.${ match }`) }}
					</router-link>
				</template>
				<template v-else>{{ $t($te(match) ? match : `pageLabels.${ match }`) }}</template>

				<template v-if="index > 0">
					<i class="fa fa-angle-right"></i>
				</template>
			</menuitem>
		</menu>
	</nav>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>