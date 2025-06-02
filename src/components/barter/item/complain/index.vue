<template>
	<div 
		class="block complain-holder"
		:title="$t('complaintLabels.hint')"
	>
		<a 
			class="link" 
			href="#"
			@click.prevent="openComplaintDialog"
		>
			<span><i class="fa fa-ban"></i> {{ $t("complaintLabels.complain") }}</span>
		</a>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>