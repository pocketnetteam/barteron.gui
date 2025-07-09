<template>
	<v-button
		class="user-sub-menu"
		vType="light"
		vSize="md"
		:dropdown="itemsList"
		:htmlDropdownMode="true"
		:hideButton="false"
		:rippleEffect="false"
		@selected="selectItem"
	>
		<a class="avatar">
			<i
				v-if="!avatar?.startsWith('http')"
				:style="hslColor"
			>{{ shortName }}</i>
			
			<picture v-else>
				<img :src="avatar" :alt="user?.name">
			</picture>
		</a>
	</v-button>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>