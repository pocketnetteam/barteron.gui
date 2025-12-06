<template>
	<v-content 
		class="overflow-auto" 
		:key="item?.hash"
	>
		<BarterItem
			ref="barterItem"
			:item="item"
			vType="page"
		/>

		<Votes
			class="temporary-adding-margin-bottom"
			:item="item"
			:form="!!(item)"
		/>
	</v-content>
</template>

<script src="./index.js"></script>