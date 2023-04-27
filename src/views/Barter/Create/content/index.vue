<template>
	<v-content class="shrink-right">
		<!-- Title: What you propose -->
		<strong class="title">{{ $t('steps.propose') }}</strong>

		<div class="row block">
			<!-- Input: Title -->
			<v-input :placeholder="$t('title')" vSize="lg" />
		</div>
		
		<div class="row block sep">
			<!-- Select: Category -->
			<v-select
				class="full-width"
				:dropdown="[{ text: $t('choose_category') }, { text: 'Category', value: 'category' }]"
				vSize="lg"
			/>
		</div>

		<div class="row block sep">
			<!-- Title: Photos -->
			<strong class="title">{{ $t('steps.photos') }}</strong>

			<!-- Component: Photo uploader -->
			<v-photos />

			<!-- Paragraph: Image upload text -->
			<p>{{ $t('upload_image_text') }}</p>
		</div>

		<div class="row block">
			<!-- Title: What you want to get -->
			<strong class="title">{{ $t('steps.get') }}</strong>

			<!-- Radio: My list, Something, For nothing -->
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
			<!-- Select: Category -->
			<v-select
				class="full-width"
				:dropdown="[{ text: $t('choose_category') }, { text: 'Category', value: 'category' }]"
				vSize="lg"
			/>
		</div>

		<div class="row block">
			<!-- Input: What you want to get -->
			<v-input :placeholder="$t('steps.get')" vSize="lg" />
		</div>

		<div class="row block">
			<!-- Label: Currency text -->
			<label for="currency" class="v-label">{{ $t('choose_currency_text') }}</label>

			<!-- Input: Currency exchange to PKOIN -->
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
			<!-- Radio: Used, New -->
			<v-switch
				type="radio"
				checked="used"
				:value="['used', 'new']"
				:label="[$t('condition.used'), $t('condition.new')]"
				vType="slide"
			/>
		</div>

		<div class="row block sep">
			<!-- Title: Description -->
			<strong class="title">{{ $t('steps.description') }}</strong>

			<!-- Textarea: Description -->
			<v-textarea length="9000" />
		</div>

		<div class="row block">
			<!-- Title: Location -->
			<strong class="title">{{ $t('steps.location') }}</strong>

			<!-- Radio: Current location, Exact address -->
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
			<!-- Input: City -->
			<v-input :placeholder="$t('city_name')" vSize="lg" />
		</div>

		<div class="row block sep">
			<!-- Component: Map -->
			<v-map />
		</div>

		<div class="row full-width">
			<!-- Button: Cancel -->
			<v-button vType="stroke-bulma">{{ $t('buttonLabels.cancel') }}</v-button>

			<div class="buttons-holder h-w">
				<!-- Button: Preview -->
				<v-button vType="stroke-bulma">{{ $t('buttonLabels.preview') }}</v-button>

				<!-- Button: Publish -->
				<v-button>{{ $t('buttonLabels.publish') }}</v-button>
			</div>
		</div>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>