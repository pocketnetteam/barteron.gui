<template>
	<ExchangeList
		:tags="account?.tags || []"
		:editable="isMyProfile"
		@change="(tags) => account.set({ tags })"
	>
		<template #edit="{ instance }">
			<!-- Edit button -->
			<template v-if="!instance.editing">
				<v-button vType="bulma-stroke" @click="instance.edit">
					{{ $t('buttonLabels.edit') }}
				</v-button>
			</template>

			<!-- Cancel and Save buttons -->
			<template v-else>
				<div class="buttons-holder">
					<v-button vType="chi-chi" @click="instance.cancel">
						{{ $t('buttonLabels.cancel') }}
					</v-button>

					<v-button @click="instance.save">
						{{ $t('buttonLabels.save') }}
					</v-button>
				</div>
			</template>
		</template>
	</ExchangeList>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>