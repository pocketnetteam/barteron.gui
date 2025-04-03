<template>
	<div class="option-buttons">
		<v-button :to="{ name: 'createBarter', params: { id: item?.hash, from: $route.params.from } }">
			<template v-if="!isPreview">
				<i class="fa fa-pen"></i>
				<span>{{ $t('buttonLabels.edit') }}</span>
			</template>
			<template v-else>
				<i class="fa fa-undo"></i>
				<span>{{ $t('buttonLabels.continue_edit') }}</span>
			</template>
		</v-button>

		<v-button
			v-if="offerExists"
			vType="hit"
			:to="{ name: 'exchangeOptions', params: { id: item?.hash }, query: { expanded: 1 } }"
		>
			<i class="fa fa-sync"></i>
			<span>{{ $t('buttonLabels.find_exchange_options') }}</span>
		</v-button>

		<template v-if="!isPreview">
			<v-button
				v-if="item.published === 'published'"
				vType="bulma-stroke"
				@click="withdrawOffer"
			>
				<i class="fa fa-undo"></i>
				<span>{{ $t('buttonLabels.withdraw') }}</span>
			</v-button>
			<v-button
				v-else
				vType="hit-stroke"
				@click="renewOffer"
			>
				<i class="fa fa-redo"></i>
				<span>{{ $t('buttonLabels.renew') }}</span>
			</v-button>

			<v-button
				vType="dodoria-stroke"
				@click="removeOffer"
			>
				<i class="fa fa-trash"></i>
				<span>{{ $t('buttonLabels.remove') }}</span>
			</v-button>
		</template>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>