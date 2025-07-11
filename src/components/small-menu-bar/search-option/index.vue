<template>
	<v-button
		class="btn-search"
		:vType="$route.query?.search ? 'hit' : 'light'"
		vSize="md"
		@click="showLightbox"
	>
		<i class="fa fa-search"></i>

		<template #after>
			<v-lightbox
				:visible="lightbox"
				size="xl"
				:title="$t('searchLabels.label')"
				:noBorders="true"
				@onHide="hideLightbox"
			>

				<div class="row gap-sm search-bar-holder">
					<div class="search-bar">
						<div class="text-field">
							<input
								ref="textField"
								type="text"
								:placeholder="$t(
									`searchLabels.${ id && id !== 'search' ? 'category' : 'global' }`,
									{ category: $t(categories.items[id]?.name || 'categoryLabels.label') })
								"
								v-model="query"
								@keyup.enter="submit"
							>
						</div>
						
						<v-button
							class="btn-reset"
							:vType="applyButtonEnabled() ? 'transparent light-color' : undefined"
							vSize="md"
							v-show="query"
							@click="reset"
						>
							<i 
								class="fa fa-times"
								:class="!(applyButtonEnabled()) ? 'activated' : ''"
							></i>
						</v-button>
					</div>

					<v-button
						class="btn-apply"
						vSize="xs"
						:rippleEffect="false"
						:disabled="!(applyButtonEnabled())"
						@click="submit"
					>{{ $t('buttonLabels.apply') }}</v-button>
				</div>

			</v-lightbox>
		</template>

	</v-button>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>