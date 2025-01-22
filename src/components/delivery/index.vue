<template>
	<div class="delivery">
		<v-switch
			id="delivery"
			type="checkbox"
			:label="entries.map(e => e.caption)"
			:value="entries.map(e => e.address)"
		>
			<template #controlBefore="{ index }">
				<img :src="entries[index].images[0]" :alt="entries[index].caption">
			</template>
		</v-switch>
	</div>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>