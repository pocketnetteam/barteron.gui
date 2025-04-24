<template>
	<v-content class="overflow-auto">
		<BarterItem
			ref="barterItem"
			:item="item"
			vType="page"
		/>

		<Votes
			:item="item"
			:form="!!(item)"
		/>
	</v-content>
</template>

<script src="./index.js"></script>