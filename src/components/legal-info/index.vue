<template>
	<div class="legal-info">
		<ul class="legal-info-list">
			<li 
				v-for="item in list()"
				:key="item.i18nKey"
			>
				<a 
					class="link" 
					href="#" 
					@click.prevent="openDocument(item)"
				><i :class="`fa fa-${item.icon}`"></i>{{ $t(`legalLabels.${item.i18nKey}`) }}</a>
			</li>
		</ul>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>