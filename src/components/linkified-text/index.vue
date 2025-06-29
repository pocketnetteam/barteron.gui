<template>
	<span>
		<template v-for="item in items()">
			<a 
				v-if="item.isLink"
				class="link"
				:href="item.href" 
				@click.prevent="sdk.openExternalLink(item.href)"
			>{{ item.displayedValue }}</a>
			<template v-else>{{ item.value }}</template>
		</template>
	</span>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>