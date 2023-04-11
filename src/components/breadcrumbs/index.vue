<template>
	<nav class="breadcrumbs">
		<menu>
			<menuitem
				v-for="(match, index) in matches"
				:key="index"
			>
				<template v-if="index < matches.length - 1">
					<router-link :to="match.to || { name: match.name }">
						{{ text(match.name) }}
					</router-link>
				</template>
				<template v-else>{{ text(match.name) }}</template>

				<template v-if="index > 0">
					<i class="fa fa-angle-right"></i>
				</template>
			</menuitem>
		</menu>
	</nav>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>