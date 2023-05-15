<template>
	<v-aside>
		<menu class="box steps">
			<menuitem
				v-for="(item, key) in $t('steps')"
				:key="key"
			>
				<a :href="`#${ key }`">{{ item }}</a>
			</menuitem>
		</menu>
	</v-aside>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>