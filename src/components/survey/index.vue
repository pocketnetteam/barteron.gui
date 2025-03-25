<template>
	<v-lightbox
		class="survey-dialog"
		size="md"
		:visible="lightbox"
		:title="$t('surveyLabels.title')"
		:closeButtonDisabled="loading"
		@onHide="hide"
	>

		<v-form 
			ref="form"
			:rules="rules"
		>
			<div 
				:class="{
					'validation-info': true,
					'failed': answersFailed
				}"
			>
				<p>{{ $t('surveyLabels.empty_answers') }}</p>
			</div>

			<div class="row block sep">
				<!-- Question1 -->
				<label class="v-label" for="answer1">{{ $t('surveyLabels.question1') }}</label>
				<v-textarea
					ref="answer1"
					class="field"
					id="answer1"
					name="answer1"
					length="9000"
					:placeholder="$t('surveyLabels.answer_placeholder')"
					@contentChanged="textareaContentChanged"
				></v-textarea>
			</div>

			<div class="row block" :class="{'sep': emailAllowed}">
				<!-- Question2 -->
				<label class="v-label" for="answer2">{{ $t('surveyLabels.question2') }}</label>
				<v-textarea
					ref="answer2"
					class="field"
					id="answer2"
					name="answer2"
					length="9000"
					:placeholder="$t('surveyLabels.answer_placeholder')"
					@contentChanged="textareaContentChanged"
				></v-textarea>
			</div>

			<div 
				v-if="emailAllowed"
				class="row block"
			>
				<!-- Email -->
				<label class="v-label" for="email">{{ $t('surveyLabels.email') }}</label>
				<v-input
					class="field"
					id="email"
					name="email"
					type="email"
					:placeholder="$t('surveyLabels.email_placeholder')"
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
						<span>{{ $t('buttonLabels.cancel') }}</span>
					</v-button>

					<v-button
						:disabled="loading"
						@click="submit"
					>
						<span>{{ $t('buttonLabels.submit') }}</span>
					</v-button>
				</div>
			</div>
		</template>
	</v-lightbox>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>