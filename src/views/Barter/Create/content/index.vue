<template>
	<v-content class="shrink-right">
		<v-form ref="form">
			<!-- Title: What you propose -->
			<strong class="title">{{ $t('steps.propose') }}</strong>

			<div class="row block">
				<!-- Input: Title -->
				<v-input
					ref="caption"
					class="field"
					name="title"
					:placeholder="$t('title')"
					:value="offer.caption"
					vSize="lg"
				/>
			</div>
			
			<div class="row block sep">
				<!-- Select: Category -->
				<Category
					ref="category"
					class="field"
					:value="offer.tag"
				/>
			</div>

			<div class="row block sep">
				<!-- Title: Photos -->
				<strong class="title">{{ $t('steps.photos') }}</strong>

				<!-- vPhotos -->
				<v-photos
					ref="photos"
					class="field"
					multiple="multiple"
					accept="jpeg, png"
					maxLen="10"
					:images="Array.isArray(offer.images) ? offer.images : []"
				/>

				<!-- Paragraph: Image upload text -->
				<p>{{ $t('upload_image_text', {
					count: 10,
					formats: ["JPEG, PNG"].join(),
					size: 25
				}) }}</p>
			</div>

			<div class="row block">
				<!-- Title: What you want to get -->
				<strong class="title">{{ $t('steps.get') }}</strong>

				<!-- vSwitch: My list, Something, For nothing -->
				<v-switch
					type="radio"
					:checked="getting"
					:value="['my_list', 'something', 'for_nothing']"
					:label="[$t('my_list'), $t('something'), $t('for_nothing')]"
					vType="button"
					vSize="lg"
					@change="(tags) => getting = tags"
				/>
			</div>

			<div class="row block">
				<!-- Select: Tags (from account) -->
				<template v-if="getting === 'my_list'">
					<ExchangeList
						class="field"
						key="account"
						ref="account"
						vSize="lg"
						:tags="account?.tags || []"
						:title="false"
						:editable="true"
						@change="(tags) => account.set({ tags })"
					>
						<template #default="{ instance }">
							<input name="tags" type="hidden" :value="instance.vTags.join()">
						</template>
					</ExchangeList>
				</template>

				<!-- Select: Tags (editable) -->
				<template v-if="getting === 'something'">
					<ExchangeList
						class="field"
						key="something"
						ref="something"
						vSize="lg"
						:tags="tags"
						:title="false"
						:editable="true"
						@change="(value) => tags = value"
					>
						<template #default="{ instance }">
							<input name="tags" type="hidden" :value="instance.vTags.join()">
						</template>
					</ExchangeList>
				</template>
			</div>

			<div class="row block" v-if="getting !== 'for_nothing'">
				<!-- Label: Currency text -->
				<label for="currency" class="v-label">{{ $t('choose_currency_text') }}</label>

				<!-- Input: Currency exchange to PKOIN -->
				<v-input
					ref="price"
					:name="['', 'price']"
					:type="['number', 'number']"
					:readonly="[null, true]"
					:value="[price, pkoin]"
					:min="['0', '']"
					class="currency-input"
					vSize="lg"
					:vEvents="{
						'input': calcPrice,
						'change': calcPrice
					}"
				>
					<template #input0After>
						<v-select
							ref="currency"
							:dropdown="currencies"
							@selected="calcPrice"
						/>
					</template>

					<template #input1After>
						<span class="icon pkoin">PKOIN</span>
					</template>
				</v-input>
			</div>

			<div class="row block sep">
				<!-- vSwitch (Radio) -->
				<v-switch
					type="radio"
					name="condition"
					:checked="condition"
					:value="['used', 'new']"
					:label="[$t('condition.used'), $t('condition.new')]"
					vType="slide"
					@change="(value) => condition = value"
				/>
			</div>

			<div class="row block sep">
				<!-- Title: Description -->
				<strong class="title">{{ $t('steps.description') }}</strong>

				<!-- vTextarea -->
				<v-textarea
					ref="description"
					class="field"
					name="description"
					length="9000"
					:value="offer.description"
				/>
			</div>

			<div class="row block">
				<!-- Title: Location -->
				<strong class="title">{{ $t('steps.location') }}</strong>

				<!-- vMap -->
				<v-map
					ref="map"
					:center="geohash || location || undefined"
					:point="geohash || undefined"
					:allowPosition="true"
					:allowSelection="true"
				/>
			</div>

			<div class="row full-width">
				<!-- vButton: Cancel -->
				<v-button vType="bulma-stroke">{{ $t('buttonLabels.cancel') }}</v-button>

				<div class="buttons-holder h-w">
					<!-- vButton: Preview -->
					<v-button
						vType="bulma-stroke"
						@click="preview"
					>{{ $t('buttonLabels.preview') }}</v-button>

					<!-- vButton: Publish -->
					<v-button @click="submit">{{ $t('buttonLabels.publish') }}</v-button>
				</div>
			</div>
		</v-form>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>