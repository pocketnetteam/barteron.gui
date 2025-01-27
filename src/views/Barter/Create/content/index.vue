<template>
	<v-content class="shrink-right">
		<v-form ref="form">
			<!-- Title: What you propose -->
			<strong class="title">{{ $t('stepsLabels.propose') }}</strong>

			<div class="row block">
				<!-- Input: Title -->
				<v-input
					ref="caption"
					class="field"
					name="title"
					id="propose"
					:placeholder="$t('title')"
					:value="offer.caption"
					vSize="lg"
				/>
			</div>
			
			<div class="row block sep">
				<!-- Select: Category -->
				<Category
					ref="category"
					class="field-novalidate"
					:value="offer.tag"
				/>
			</div>

			<div class="row block sep">
				<!-- Title: Photos -->
				<strong class="title">{{ $t('stepsLabels.photos') }}</strong>

				<!-- vPhotos -->
				<v-photos
					ref="photos"
					id="photos"
					class="field"
					multiple="multiple"
					accept="jpeg, png"
					maxLen="10"
					:images="Array.isArray(offer.images) ? offer.images : []"
				/>

				<!-- Paragraph: Image upload text -->
				<p>
					{{
						$t('photosLabels.upload_image_text', {
							count: 10,
							formats: ["JPEG, PNG"].join()
						})
					}}
				</p>
			</div>

			<div id="get" class="row block">
				<!-- Title: What you want to get -->
				<strong class="title">{{ $t('stepsLabels.get') }}</strong>

				<!-- vSwitch: My list, Something, For nothing -->
				<v-switch
					type="radio"
					name="getting"
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
						key="account"
						ref="account"
						holderClass="field"
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

				<!-- Label: My list text -->
				<label v-if="getting === 'my_list'" class="v-label">
					<i class="fa fa-info-circle"></i>
					{{ $t('my_list_text') }}
				</label>							

				<!-- Select: Tags (editable) -->
				<template v-if="getting === 'something'">
					<ExchangeList
						key="something"
						ref="something"
						holderClass="field"
						vSize="lg"
						:tags="tags"
						:title="false"
						:editable="true"
						:editMode="true"
						@change="(value) => tags = value"
					>
						<template #default="{ instance }">
							<input name="tags" type="hidden" :value="instance.vTags.join()">
						</template>

						<template #after="{ instance }">
							<!-- Favorite tags -->
							<ul class="favorites">
								<template v-for="(id, index) in [17,38,13,11116,23,13587,26395,6,9]">
									<li
										:key="`favorite-${ index }`"
										v-if="!instance.vTags.includes(id)"
										@click="instance.insert(id)"
									>{{ 
										$t(categories.items[id]?.name) || $t('buttonLabels.unknown') 
									}}<i class="fa fa-plus"></i>
									</li>
								</template>
							</ul>
						</template>
					</ExchangeList>
				</template>
			</div>

			<div class="row block" v-if="getting !== 'for_nothing'">
				<!-- Input: Currency exchange to PKOIN -->
				<v-input
					ref="price"
					:name="['price', 'pkoin']"
					:type="['number', 'number']"
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
						<span class="icon">
							<i class="icon-pkoin"></i>
							PKOIN
						</span>
					</template>
				</v-input>

				<!-- Label: Currency text -->
				<label for="currency" class="v-label">
					<i class="fa fa-info-circle"></i>
					{{ $t('choose_currency_text') }}
				</label>
			</div>

			<div class="row block sep">
				<!-- vSwitch (Radio) -->
				<v-switch
					type="radio"
					name="condition"
					:checked="condition"
					:value="['used', 'new']"
					:label="[$t('conditionLabels.used'), $t('conditionLabels.new')]"
					vType="slide"
					@change="(value) => condition = value"
				/>
			</div>

			<div class="row block sep">
				<!-- Title: Description -->
				<strong class="title">{{ $t('stepsLabels.description') }}</strong>

				<!-- vTextarea -->
				<v-textarea
					ref="description"
					id="description"
					class="field"
					name="description"
					length="9000"
					:value="offer.description"
				/>
			</div>

			<div
				class="row block"
				:class="{ 'sep': deliveryPoints.length }"
			>
				<!-- Title: Location -->
				<strong class="title">{{ $t('stepsLabels.location') }}</strong>

				<!-- vMap -->
				<v-map
					id="location"
					class="map"
					ref="map"
					mapMode="input"
					:center="geohash || location || undefined"
					@change="getDeliveryPoints"
					@errorEvent="errorEvent"
				/>
			</div>

			<div
				class="row block"
				v-if="deliveryPoints.length"
			>
				<!-- Delivery -->
				<Delivery
					ref="delivery"
					:entries="deliveryPoints"
					type="checkbox"
				>
					<template #before>
						<!-- Title: Delivery -->
						<strong class="title">{{ $t('deliveryLabels.label') }}</strong>
					</template>
				</Delivery>
			</div>

			<div id="offer-options" class="row full-width wrap">
				<!-- vButton: Cancel -->
				<v-button
					vType="bulma-stroke"
					@click="cancel"
				>{{ $t('buttonLabels.cancel') }}</v-button>

				<div class="buttons-holder min-h-w">
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