<template>
	<aside
		id="aside"
		:class="{ active }"
	>
		<a
			class="side-toggle"
			href="#"
			@click.prevent="toggle"
		>
			<template v-if="active">
				<i
					v-if="icon?.default"
					:class="{ 'fa': 1, [`fa-${ icon.default }`]: 1 }"
				></i>
				<i
					v-else
					class="fa fa-angle-left"
				></i>
			</template>
			<template v-else>
				<i
					v-if="icon?.active"
					:class="{ 'fa': 1, [`fa-${ icon.active }`]: 1 }"
				></i>
				<i
					v-else
					class="fa fa-angle-right"
				></i>
			</template>
		</a>
		<slot></slot>
	</aside>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>