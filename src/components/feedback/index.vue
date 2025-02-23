<template>
	<div class="feedback">
		<v-button
			vType="light"
			vSize="md"
			@click="click"
		>
			<i class="fa fa-comments"></i>
		</v-button>
		
		<v-lightbox
			size="md"
			:close="false"
			:visible="lightbox"
			:overlayClick="!loading"
			@onHide="() => lightbox = false"
		>
			<template #header>
				<div class="title">
					<h1>{{ $t('feedbackLabels.title') }}</h1>

					<v-button
						class="v-lightbox-close"
						vType="light"
						:disabled="loading"
						@click="() => lightbox = false"
					>
						<i class="fa fa-times"></i>
					</v-button>
				</div>
			</template>

			<v-form ref="form">
				<div class="row block">
					<!-- Input: Name -->
					<v-input
						class="field"
						name="title"
						:placeholder="$t('feedbackLabels.name')"
					/>
				</div>

				<div class="row block">
					<!-- Input: Email -->
					<v-input
						class="field"
						name="title"
						type="email"
						:placeholder="$t('feedbackLabels.email')"
					/>
				</div>
				
				<div class="row block sep">
					<!-- Textarea: Message -->
					<v-textarea
						class="field"
						name="message"
						length="9000"
						:placeholder="$t('feedbackLabels.message')"
					></v-textarea>
				</div>

				<div class="row full-width">
					<!-- vButton: Submit -->
					<v-button
						:disabled="loading"
						@click="submit"
					>{{ $t('buttonLabels.submit') }}</v-button>
				</div>
			</v-form>
		</v-lightbox>
	</div>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>