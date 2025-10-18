<template>
	<v-lightbox
		class="safe-deal-dialog"
		size="md"
		:visible="lightbox"
		:title="$t('safeDealLabels.label')"
		@onHide="hide"
	>

		<h1 class="title">
			{{ $t('safeDealLabels.faq_question1') }}
		</h1>

		<h1 
			class="info" 
			v-html="($t('safeDealLabels.faq_answer1')).replaceAll('\n','<br>')"
		></h1>

		<h1 class="title">
			{{ $t('safeDealLabels.faq_question2') }}
		</h1>

		<h1 
			class="info" 
			v-html="($t('safeDealLabels.faq_answer2')).replaceAll('\n','<br>')"
		></h1>

		<h1 class="title">
			{{ $t('safeDealLabels.faq_question3') }}
		</h1>

		<h1 
			class="info" 
			v-html="($t('safeDealLabels.faq_answer3')).replaceAll('\n','<br>')"
		></h1>

		<h1 class="title">
			{{ $t('safeDealLabels.faq_question4') }}
		</h1>

		<h1 
			class="info" 
			v-html="($t('safeDealLabels.faq_answer4')).replaceAll('\n','<br>')"
		></h1>

		<!-- Footer -->
		<template #footer>
			<div class="row full-width right">
				<div class="buttons-holder min-h-w">
					<v-button 
						@click="hide"
					>
						<span>{{ $t('buttonLabels.close') }}</span>
					</v-button>
				</div>
			</div>
		</template>
	</v-lightbox>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>