<template>
	<v-lightbox
		class="referral-program-dialog"
		size="md"
		:visible="lightbox"
		:title="$t('referralLabels.title')"
		@onHide="hide"
	>

		<h1 class="title">
			{{ $t('referralLabels.earn_pkoin_by_promoting_barteron') }}
		</h1>

		<h1 class="info">
			{{ $t('referralLabels.paragraph1') }}
		</h1>

		<h1 class="info">
			{{ $t('referralLabels.paragraph2') }}
			<a 
				class="link" 
				:href="referralProgramInfoURL"
				@click.prevent="openReferralProgramInfo"
			><b>{{ referralProgramInfoURL }}</b></a>
		</h1>

		<!-- Footer -->
		<template #footer>
			<div class="row full-width right">
				<div class="buttons-holder min-h-w">
					<v-button 
						vType="hit"
						@click="getReferralLink"
					>
						<i class="fa fa-link"></i><span>{{ $t('buttonLabels.copy_referral_link') }}</span>
					</v-button>
				</div>
			</div>
		</template>
	</v-lightbox>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>