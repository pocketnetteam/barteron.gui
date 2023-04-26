<template>
	<v-content class="shrink">
		<strong class="title">{{ $t('steps.propose') }}</strong>

		<div class="row block">
			<v-input :placeholder="$t('title')" vSize="lg" />
		</div>
		
		<div class="row block sep">
			<v-select
				class="full-width"
				:dropdown="[{ text: $t('choose_category') }, { text: 'Category', value: 'category' }]"
				vSize="lg"
			/>
		</div>

		<div class="row block sep">
			<strong class="title">{{ $t('steps.photos') }}</strong>
			<button class="photo-uploader">
				<input type="file">
				<span class="text">
					<i class="fa fa-plus"></i>
					<span>{{ $t('upload_image') }}</span>
				</span>
			</button>
			<p>{{ $t('upload_image_text') }}</p>
		</div>

		<div class="row block">
			<strong class="title">{{ $t('steps.get') }}</strong>
			<v-switch
				type="radio"
				checked="something"
				:value="['my_list', 'something', 'for_nothing']"
				:label="[$t('my_list'), $t('something'), $t('for_nothing')]"
				vType="button"
				vSize="lg"
			/>
		</div>

		<div class="row block">
			<v-select
				class="full-width"
				:dropdown="[{ text: $t('choose_category') }, { text: 'Category', value: 'category' }]"
				vSize="lg"
			/>
		</div>

		<div class="row block">
			<v-input :placeholder="$t('steps.get')" vSize="lg" />
		</div>

		<div class="row block">
			<label for="currency" class="v-label">{{ $t('choose_currency_text') }}</label>
			<v-input
				:type="['number', 'number']"
				:readonly="[null, true]"
				:value="['0', '0']"
				class="currency-input"
				vSize="lg"
			>
				<template v-slot:input0After>
					<v-select :dropdown="[{ text: 'USD', value: 'usd' }]" />
				</template>

				<template v-slot:input1After>
					<span class="icon pkoin">PKOIN</span>
				</template>
			</v-input>
		</div>

		<div class="row block sep">
			<v-switch
				type="radio"
				checked="used"
				:value="['used', 'new']"
				:label="[$t('condition.used'), $t('condition.new')]"
				vType="slide"
			/>
		</div>

		<div class="row block sep">
			<strong class="title">{{ $t('steps.description') }}</strong>
			<v-textarea length="9000" />
		</div>

		<div class="row block">
			<strong class="title">{{ $t('steps.location') }}</strong>
			<v-switch
				class="full-width"
				type="radio"
				checked="location"
				:value="['location', 'address']"
				:label="[$t('steps.location'), $t('exact_address')]"
				vType="slide"
			/>
		</div>

		<div class="row block">
			<v-input :placeholder="$t('city_name')" vSize="lg" />
		</div>

		<div class="row block sep">
			MAP
		</div>

		<div class="row full-width">
			<v-button vType="stroke-bulma">{{ $t('buttonLabels.cancel') }}</v-button>

			<div class="buttons-holder h-w">
				<v-button vType="stroke-bulma">{{ $t('buttonLabels.preview') }}</v-button>
				<v-button>{{ $t('buttonLabels.publish') }}</v-button>
			</div>
		</div>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>