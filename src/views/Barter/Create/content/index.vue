<template>
	<v-content class="shrink-right overflow-auto">
		<v-form 
			ref="form"
			:rules="validationRules"
		>
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

				<label
					v-if="!(offerCreationParams().isAllowed)"
					class="v-label error-level"
				>
					<i class="fa fa-info-circle"></i>
					{{ offerCreationParams().blockingMessage }}
				</label>
			</div>

			<div 
				v-if="offerCreationParams().isAllowed" 
				class="row block sep"
			>
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
					<i class="fa fa-info-circle"></i>
					{{
						$t('photosLabels.upload_image_text', {
							count: 10,
							formats: ["JPEG, PNG"].join()
						})
					}}
				</p>
			</div>

			<div 
				v-if="offerCreationParams().isAllowed" 
				id="get" 
				class="row block"
			>
				<!-- Title: What you want to get -->
				<strong class="title">{{ $t('stepsLabels.get') }}</strong>

				<!-- vSwitch: My list, Something, For nothing -->
				<v-switch
					type="radio"
					name="getting"
					:selected="getting"
					:value="['my_list', 'something', 'for_nothing']"
					:label="[$t('my_list'), $t('something'), $t('for_nothing')]"
					vType="button"
					vSize="lg"
					@change="(tags) => getting = tags"
				/>
			</div>

			<div 
				v-if="offerCreationParams().isAllowed" 
				class="row block"
			>
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

			<strong
				v-if="getting !== 'for_nothing' && isPickupPointCategory() && offerCreationParams().isAllowed"
				class="subtitle"
			>{{ $t('deliveryLabels.pickup_point_price_caption') }}</strong>

			<div 
				v-if="getting !== 'for_nothing' && offerCreationParams().isAllowed" 
				class="row block"
			>
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
							vSize="xs"
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
				<label 
					id="currency-label"
					for="currency" 
					class="v-label"
				>
					<i class="fa fa-info-circle"></i>
					{{ priceHintLabel() }}
				</label>

				<!-- vSwitch: currency price -->
				<div 
					v-if="currencyPriceAvailable"
					class="row" 
					id="currency-price-holder"
				>
					<v-switch
						class="no-padding"
						type="checkbox"
						name="currencyPrice"
						:label="currencyPriceLabel()"
						:selected="currencyPriceEnabled ? 'enabled' : ''"
						:value="'enabled'"
						vType="checkbox"
						vSize="xl"
						@change="currencyPriceEnabledStateChanged"
					/>
				</div>

			</div>

			<div 
				v-if="offerCreationParams().isAllowed" 
				class="row block sep"
			>
				<!-- vSwitch (Radio) -->
				<v-switch
					type="radio"
					name="condition"
					:selected="condition"
					:value="['used', 'new']"
					:label="[$t('conditionLabels.used'), $t('conditionLabels.new')]"
					vType="slide"
					@change="(value) => condition = value"
				/>
			</div>

			<!-- Delivery fields -->
			<div 
				v-if="deliveryAvailable && isPickupPointCategory() && offerCreationParams().isAllowed"
				id="pickup-point-info"
				class="row block"
			>
				<strong class="title">{{ $t('deliveryLabels.pickup_point_info') }}</strong>

				<div class="row block">
					<strong class="subtitle">{{ $t('deliveryLabels.financial_terms') }}</strong>

					<v-textarea
						ref="financialTerms"
						id="financial-terms"
						class="field"
						name="financialTerms"
						length="250"
						:value="pickupPoint?.financialTerms"
					/>
				</div>

				<div class="row block">
					<strong class="subtitle">{{ $t('deliveryLabels.shelf_life') }}</strong>

					<v-input
						ref="shelfLife"
						class="field-novalidate"
						name="shelfLife"
						id="shelf-life"
						:readonly="'shelfLife'"
						:value="$t('deliveryLabels.default_shelf_life_value')"
						vSize="lg"
					/>
					<label 
						id="shelf-life-label"
						for="shelf-life" 
						class="v-label"
					>
						<i class="fa fa-info-circle"></i>
						{{ $t('deliveryLabels.shelf_life_hint') }}
					</label>

				</div>

				<div class="row block">
					<strong class="subtitle">{{ $t('deliveryLabels.work_schedule') }}</strong>

					<work-schedule
						ref="workSchedule"
						id="work-schedule"
						mode="edit"
						holderClass="field"
						name="workSchedule"
						:workSchedule="pickupPoint?.workSchedule"
					/>
				</div>

				<div class="row block">
					<strong class="subtitle">{{ $t('deliveryLabels.address') }}</strong>

					<v-input
						ref="address"
						class="field"
						name="address"
						id="address"
						:value="pickupPoint?.address"
						vSize="lg"
					/>
				</div>

				<div class="row block">
					<strong class="subtitle">{{ $t('deliveryLabels.how_to_get') }}</strong>

					<v-textarea
						ref="route"
						id="route"
						class="field"
						name="route"
						length="1000"
						:value="pickupPoint?.route"
					/>
				</div>

			</div>

			<div 
				v-if="offerCreationParams().isAllowed" 
				class="row block sep"
			>
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
				v-if="offerCreationParams().isAllowed" 
				class="row block sep"
			>
				<!-- Title: Location -->
				<strong class="title">{{ $t('stepsLabels.location') }}</strong>

				<!-- vMap -->
				<v-map
					id="location"
					class="map"
					ref="map"
					:height="mapHeight()"
					:mapMode="mapMode()"
					:pickupPointPopupMode="'input'"
					:selectedOfferIds="selectedOfferIds()"
					:center="geohash || location || undefined"
					:mapActionData="mapActionData"
					@errorEvent="mapErrorEvent"
					@mapAction="mapAction"
					@selectPickupPoint="selectPickupPoint"
					@unselectPickupPoint="unselectPickupPoint"
				/>
			</div>

			<div 
				class="row block sep"
				v-if="deliveryAvailable && !(isPickupPointCategory()) && offerCreationParams().isAllowed""
			>
				<!-- Title: Delivery -->
				<strong class="title">{{ $t('deliveryLabels.label') }}</strong>

				<!-- vSwitch: pickup points enabled -->
				<div class="row block">
					<v-switch
						class="no-padding"
						type="checkbox"
						name="pickupPointsEnabled"
						:label="$t('deliveryLabels.use_pickup_points')"
						:image="{src: imageUrl('pickup-point.png'), alt: 'icon'}"
						:selected="pickupPointsEnabled ? 'enabled' : ''"
						:value="'enabled'"
						vType="checkbox"
						vSize="xl"
						@change="pickupPointsEnabledStateChanged"
					/>

					<label 
						v-if="pickupPointsEnabled"
						class="v-label"
						:class="{'warning-level': !(pickupPointItems.length)}"
					>
						<i class="fa fa-info-circle"></i>
						{{ $t("deliveryLabels.pickup_points_enabled_hint") }}
					</label>
				</div>

				<PickupPointList
					v-if="pickupPointsEnabled"
					ref="pickupPointList"
					id="pickup-point-list"
					holderClass="field"
					:items="pickupPointItems"
					:loaderState="pickupPointsLoading"
					:loaderItems="pickupPointsLoadingCount"
					:loadingError="pickupPointsLoadingError"
					mode="input"
					@unselectItem="unselectPickupPoint"
					@repeatLoading="pickupPointsRepeatLoading"
				/>

				<!-- vSwitch: self pickup enabled -->
				<div class="row">
					<v-switch
						class="no-padding"
						type="checkbox"
						name="selfPickupEnabled"
						:label="$t('deliveryLabels.self_pickup_available')"
						:image="{src: imageUrl('self-pickup.png'), alt: 'icon'}"
						:selected="selfPickupEnabled ? 'enabled' : ''"
						:value="'enabled'"
						vType="checkbox"
						vSize="xl"
						@change="selfPickupEnabledStateChanged"
					/>
				</div>

				<div 
					v-if="selfPickupEnabled"
					class="row full-width"
				>
					<v-textarea
						ref="selfPickupAdditionalInfo"
						id="self-pickup-additional-info"
						class="field-novalidate full-width"
						name="selfPickupAdditionalInfo"
						length="1000"
						:placeholder="$t('deliveryLabels.self_pickup_additional_info_placeholder')"
						:value="deliveryOptions?.selfPickup?.additionalInfo"
					/>
				</div>
			</div>

			<div 
				v-if="offerCreationParams().isAllowed" 
				id="offer-options" 
				class="row full-width wrap"
			>
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