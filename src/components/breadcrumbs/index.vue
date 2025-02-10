<template>
	<nav class="breadcrumbs">
		<menu>
			<menuitem
				v-for="(item, index) in tree"
				:key="index"
			>
				<template v-if="lastActive || index < tree.length - 1">
					<router-link 
						:to="item.link"
					><span @click="itemClick(item)">{{ getName(item.name) }}</span></router-link>
				</template>
				<template v-else>{{ getName(item.name) }}</template>
			</menuitem>
		</menu>
	</nav>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>