<template>
	<div 
		id="survey-bar"
	>
		<div class="content row">
			<h1 class="title">
				<span>{{ $t('surveyLabels.prompt') }}</span>
			</h1>

			<div class="row buttons-holder">

				<v-button
					vSize="sm"
					@click="show"
				>
					<span>{{ $t('buttonLabels.show') }}</span>
				</v-button>

				<v-button
					class="survey-bar-close"
					vType="light"
					@click="close"
				>
					<i class="fa fa-times"></i>
				</v-button>

			</div>

		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>