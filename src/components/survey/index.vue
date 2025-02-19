<template>
	<v-lightbox
		class="survey-dialog"
		size="md"
		:visible="lightbox"
		:title="localize('surveyLabels.title')"
		:closeButtonDisabled="loading"
		@onHide="hide"
	>

		<v-form ref="form">
			<div class="row block sep">
				<!-- Question1 -->
				<label class="v-label" for="question1">{{ localize('surveyLabels.question1') }}</label>
				<v-textarea
					class="field"
					id="question1"
					name="question1"
					length="9000"
					:placeholder="localize('surveyLabels.question_placeholder')"
				></v-textarea>
			</div>

			<div class="row block sep">
				<!-- Question2 -->
				<label class="v-label" for="question2">{{ localize('surveyLabels.question2') }}</label>
				<v-textarea
					class="field"
					id="question2"
					name="question2"
					length="9000"
					:placeholder="localize('surveyLabels.question_placeholder')"
				></v-textarea>
			</div>

			<div class="row block">
				<!-- Email -->
				<label class="v-label" for="email">{{ localize('surveyLabels.email') }}</label>
				<v-input
					class="field"
					id="email"
					name="email"
					type="email"
					:placeholder="localize('surveyLabels.email_placeholder')"
				/>
			</div>
		</v-form>

		<!-- Footer -->
		<template #footer>
			<div class="row full-width right">
				<div class="buttons-holder min-h-w">
					<v-button
						:disabled="loading"
						@click="hide"
					>
						<span>{{ localize('buttonLabels.cancel') }}</span>
					</v-button>

					<v-button
						:disabled="loading"
						@click="submit"
					>
						<span>{{ localize('buttonLabels.submit') }}</span>
					</v-button>
				</div>
			</div>
		</template>
	</v-lightbox>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>