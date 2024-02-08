<template>
	<v-content>
		<BarterItem
			:item="item"
			vType="page"
		/>

		<Votes
			:form="true"
			:items="details?.comments || []"
			:offerId="item?.hash"
		/>
	</v-content>
</template>

<script src="./index.js"></script>