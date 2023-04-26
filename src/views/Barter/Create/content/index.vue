<template>
	<v-content class="shrink">
		<strong class="title">{{ $t('steps.propose') }}</strong>

		<div class="row block">
			<v-input id="title" :placeholder="$t('title')" vSize="lg" />
		</div>
		
		<div class="row block sep">
			<v-select
				id="category"
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
			<ul class="radio-list">
				<li>
					<v-switch
						type="radio"
						name="want_get"
						:label="$t('my_list')"
						vType="button"
						vSize="lg"
					/>
				</li>

				<li>
					<v-switch
						type="radio"
						name="want_get"
						checked="checked"
						:label="$t('something')"
						vType="button"
						vSize="lg"
					/>
				</li>

				<li>
					<v-switch
						type="radio"
						name="want_get"
						:label="$t('for_nothing')"
						vType="button"
						vSize="lg"
					/>
				</li>
			</ul>
		</div>

		<div class="row block">
			<v-select
				id="category-1"
				class="full-width"
				:dropdown="[{ text: $t('choose_category') }, { text: 'Category', value: 'category' }]"
				vSize="lg"
			/>
		</div>

		<div class="row block">
			<v-input id="exchange_to" :placeholder="$t('steps.get')" vSize="lg" />
		</div>

		<div class="row block">
			<label for="currency" class="v-label">{{ $t('choose_currency_text') }}</label>
			<v-input
				:id="['currency', 'pkoin']"
				:type="['number', 'number']"
				:readonly="[null, true]"
				:value="['0', '0']"
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
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>