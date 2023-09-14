<template>
	<v-content class="shrink-right">
		<v-form ref="form">
			<!-- Title: What you propose -->
			<strong class="title">{{ $t('steps.propose') }}</strong>

			<div class="row block">
				<!-- Input: Title -->
				<v-input class="field" name="title" :placeholder="$t('title')" vSize="lg" />
			</div>
			
			<div class="row block sep">
				<!-- Select: Category -->
				<CategoriesSelect class="field" />
			</div>

			<div class="row block sep">
				<!-- Title: Photos -->
				<strong class="title">{{ $t('steps.photos') }}</strong>

				<!-- Component: Photo uploader -->
				<v-photos
					class="field"
					ref="photos"
					multiple="multiple"
					accept="jpeg, png"
					maxLen="10"
				/>

				<!-- Paragraph: Image upload text -->
				<p>{{ $t('upload_image_text').replace('%s', 'JPEG, PNG') }}</p>
			</div>

			<div class="row block">
				<!-- Title: What you want to get -->
				<strong class="title">{{ $t('steps.get') }}</strong>

				<!-- Radio: My list, Something, For nothing -->
				<v-switch
					type="radio"
					:checked="getting"
					:value="['my_list', 'something', 'for_nothing']"
					:label="[$t('my_list'), $t('something'), $t('for_nothing')]"
					vType="button"
					vSize="lg"
					@change="saveGetting"
				/>
			</div>

			<div class="row block">
				<!-- Select: Tags (from account) -->
				<template v-if="getting === 'my_list'">
					<ExchangeList
						class="field"
						vSize="lg"
						:tags="accounts?.[0]?.tags || []"
						:title="false"
					>
						<template #default="myList">
							<input name="tags" type="hidden" :value="myList.instance.vTags.join()">
						</template>
					</ExchangeList>
				</template>

				<!-- Select: Tags (editable) -->
				<template v-if="getting === 'something'">
					<ExchangeList
						class="field"
						vSize="lg"
						:tags="tags"
						:title="false"
						@change="saveTags"
					>
						<template #default="something">
							<input name="tags" type="hidden" :value="something.instance.vTags.join()">
						</template>

						<template #edit="something">
							<!-- Edit button -->
							<template v-if="!something.instance.editable">
								<v-button @click="something.instance.edit">
									<i class="fa fa-pencil-alt fa-shrink"></i>
								</v-button>
							</template>

							<!-- Cancel and Save buttons -->
							<template v-else>
								<div class="buttons-holder">
									<v-button vType="chi-chi" @click="something.instance.cancel">
										{{ $t('buttonLabels.cancel') }}
									</v-button>

									<v-button @click="something.instance.save">
										{{ $t('exchange.save') }}
									</v-button>
								</div>
							</template>
						</template>
					</ExchangeList>
				</template>
			</div>

			<div class="row block" v-if="getting !== 'for_nothing'">
				<!-- Label: Currency text -->
				<label for="currency" class="v-label">{{ $t('choose_currency_text') }}</label>

				<!-- Input: Currency exchange to PKOIN -->
				<v-input
					:name="['price', '']"
					:type="['number', 'number']"
					:readonly="[null, true]"
					:value="['0', '0']"
					class="currency-input"
					vSize="lg"
				>
					<template #input0After>
						<v-select :dropdown="[{ text: 'USD', value: 'usd' }]" />
					</template>

					<template #input1After>
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
				<v-textarea class="field" name="description" length="9000" />
			</div>

			<div class="row block">
				<!-- Title: Location -->
				<strong class="title">{{ $t('steps.location') }}</strong>

				<!-- Component: Map -->
				<v-map
					ref="map"
					:center="location"
					:allowPosition="true"
					:allowSelection="true"
				/>
			</div>

			<div class="row full-width">
				<!-- Button: Cancel -->
				<v-button vType="stroke-bulma">{{ $t('buttonLabels.cancel') }}</v-button>

				<div class="buttons-holder h-w">
					<!-- Button: Preview -->
					<v-button vType="stroke-bulma">{{ $t('buttonLabels.preview') }}</v-button>

					<!-- Button: Publish -->
					<v-button
						@click="submit"
					>{{ $t('buttonLabels.publish') }}</v-button>
				</div>
			</div>
		</v-form>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>