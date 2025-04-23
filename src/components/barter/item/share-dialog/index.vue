<template>
	<v-lightbox
		class="offer-share-dialog"
		size="md"
		:visible="lightbox"
		:title="$t('barterLabels.publication_on_bastyon')"
		@onHide="hide"
	>

		<div class="row dir-column center">
			<picture>
				<image-load>
					<!-- Image -->
					<template #image>
						<img
							:src="imageUrl(images?.[0])"
							:alt="item?.caption"
						>
					</template>

					<!-- Loader -->
					<template #loader>
						<loader type="circular" />
					</template>

					<template #error>
						<div class="img-error">
							<i class="fa fa-times-circle"></i>
						</div>
					</template>
				</image-load>
			</picture>

			<p class="caption">{{ item?.caption }}</p>

		</div>

		<h1 class="info row">
			{{ $t('barterLabels.offer_has_been_published') }}
			<br>
			{{ $t('barterLabels.share_offer_on_bastyon_hint') }}
		</h1>

		<p class="details">
			{{ $t('barterLabels.share_offer_option_availability') }}
		</p>

		<div id="offer-share-checkbox-holder">
			<v-switch
				class="no-padding"
				type="checkbox"
				name="offerShareDisabled"
				:label="$t('barterLabels.dont_show_again')"
				vType="checkbox"
				vSize="xl"
				@change="offerShareDisabledChange"
			/>
		</div>

		<!-- Footer -->
		<template #footer>
			<div class="row full-width right">
				<div class="buttons-holder min-h-w">
					<v-button 
						vType="hit"
						@click="shareOnBastyon"
					>
						<i class="fa fa-plus-circle"></i><span>{{ $t('buttonLabels.publish_on_bastyon') }}</span>
					</v-button>
				</div>
			</div>
		</template>
	</v-lightbox>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>