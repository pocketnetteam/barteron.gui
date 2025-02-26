<template>
	<v-content>
		<BarterItem
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