<template>
	<div :class="{
		[`barter-item-${ vType }`]: true,
		'barter-item-relay': hasRelay,
		'compact-view': compactView,
		'hide-info': hideInfo,
	}">
		<!-- Picture -->
		<picture 
			v-if="images?.length && vType !== 'page'"
		>
			<router-link :to="!(hasRelay || isRemoved) ? offerLink : {}">
				<span
					class="state"
					v-if="item.used"
				>{{ $t('conditionLabels.used') }}</span>
			
				<!-- Images -->
				<template>
					<ul class="slide">
						<li
							v-for="(image, index) in images"
							:key="image"
							:class="{ 'hover': hover === index }"
							@mouseenter="() => hover = index"
							@mouseleave="() => hover = 0"
						>
							<!-- First image -->
							<image-load v-if="index === 0">
								<!-- Image -->
								<template #image>
									<img
										:src="imageUrl(images?.[0])"
										:alt="item.caption"
									>
								</template>

								<!-- Loader -->
								<template #loader>
									<loader type="circular" />
								</template>

								<template #error>
									<div class="img-error">
										<i class="fa fa-times-circle"></i>
									</div>
								</template>
							</image-load>

							<!-- Next images -->
							<div class="image" v-else>
								<img
									:src="imageUrl(image)"
									:alt="`${ item.caption }#${ index+1 }`"
								>
							</div>
						</li>
					</ul>
					<ul
						class="bullets"
						v-if="images?.length > 1"
					>
						<li
							v-for="(image, index) in images"
							:key="image"
							:class="{ 'hover': hover === index }"
							@mouseenter="() => hover = index"
							@mouseleave="() => hover = 0"
						>{{ index }}</li>
					</ul>
					<Score
						v-if="averageOfferScore?.value"
						mode="preview"
						:rating="'behind'"
						:stars="1"
						:value="averageOfferScore?.value"
						:starsValue="averageOfferScore?.value"
						:votesCount="averageOfferScore?.count"
					/>
				</template>
			</router-link>
		</picture>

		<!-- View: Tile -->
		<template v-if="vType === 'tile' && !(hideInfo)">
			<div class="row pricing">
				<span class="price">
					<template v-if="item.price">
						<span class="currency icon-pkoin"></span>
						{{ pkoinPrice ? (pricePrefix + $n(pkoinPrice, 'shortPkoin')) : '...' }}
						<span>{{ $t('profileLabels.coins') }}</span>
					</template>
					<template v-else>
						<span class="currency fa fa-gift"></span>
						{{ $t('barterLabels.free') }}
					</template>
				</span>

				<span class="favorite">
					<slot name="favorite" v-if="$slots.favorite"></slot>
					<i
						:class="{
							'fa fa-heart': true,
							'active': hasLike
						}"
						@click="setLike"
						v-else
					></i>
				</span>

				<div class="currency-holder">
					<CurrencySwitcher
						:pricePrefix="pricePrefix"
						:switcher="false"
						:amount="item?.price"
						:currencyPrice="item?.currencyPrice"
						:hideButton="true"
					/>
				</div>
			</div>

			<div class="row title" v-if="item.caption">
				<router-link :to="offerLink">{{ item.caption }}</router-link>
			</div>

			<div class="row to" v-if="item?.tags?.length">
				<ul :style="exchangeList.length > 2 ? `--count: '+${ exchangeList.length - 2 }'; --len: ${ exchangeList.length.toString().length + 1 }` : ''">
					<li><span>{{ $t('barterLabels.exchange') }}: </span></li>
					<li
						v-for="(link, index) in exchangeList.slice(0, 2)"
						:key="index"
					>
						<router-link
							v-if="link.id"
							:to="{ 'name': 'category', params: { id: link.id } }"
						>{{ link.value }}</router-link>
						<span v-else>{{ link.value }}</span>
					</li>
				</ul>
			</div>

			<div class="row info" v-if="item.time || item.geohash">
				<slot name="info" v-if="$slots.info && !(hasRelay || isRemoved)"></slot>
				<ul v-else>
					<template v-if="hasRelay">
						<!-- Relay -->
						<li>
							<dl :class="item.status">
								<dt><i class="fa fa-spinner fa-spin"></i></dt>
								<dd>{{ $t(`itemLabels.${ item.published }`) }}</dd>
							</dl>
						</li>
					</template>

					<template v-else>
						<!-- Date/Distance -->
						<li v-if="item.time">
							<dl :class="item.status">
								<dt><i class="fa fa-calendar"></i></dt>
								<dd><time>{{ $d(item.time, 'middle', $i18n.locale) }}</time></dd>
							</dl>
						</li>
						<li v-if="distance > -1">
							{{ distance }} {{ $t('metricsLabels.km') }}
						</li>
					</template>
				</ul>
			</div>

			<div class="row offer" v-if="$slots.offer">
				<slot name="offer"></slot>
			</div>
		</template>

		<!-- View: Row -->
		<template v-if="vType === 'row' && !(hideInfo)">
			<div class="row descr">
				<div class="row-holder">
					<span class="title" v-if="item.caption">
						<router-link :to="offerLink">{{ item.caption }}</router-link>
					</span>

					<div class="to" v-if="item?.tags?.length">
						<ul :style="exchangeList.length > 2 ? `--count: '+${ exchangeList.length - 2 }'; --len: ${ exchangeList.length.toString().length + 1 }` : ''">
							<li><span>{{ $t('barterLabels.exchange') }}: </span></li>
							<li
								v-for="(link, index) in exchangeList.slice(0, 2)"
								:key="index"
							>
								<router-link
									v-if="link.id"
									:to="{ 'name': 'category', params: { id: link.id } }"
								>{{ link.value }}</router-link>
								<span v-else>{{ link.value }}</span>
							</li>
						</ul>
					</div>
				</div>

				<div class="pricing">
					<span class="price">
						<template v-if="item.price">
							<span class="currency icon-pkoin"></span>
							{{ pkoinPrice ? (pricePrefix + $n(pkoinPrice, 'shortPkoin')) : '...' }}
							<span>{{ $t('profileLabels.coins') }}</span>
						</template>
						<template v-else>
							<span class="currency fa fa-gift"></span>
							{{ $t('barterLabels.free') }}
						</template>
					</span>

					<div class="currency-holder">
						<CurrencySwitcher
							:pricePrefix="pricePrefix"
							:switcher="false"
							:amount="item?.price"
							:currencyPrice="item?.currencyPrice"
							:hideButton="true"
						/>
					</div>
				</div>
			</div>

			<div class="row offer">
				<div class="favorite">
					<i
						:class="{
							'fa fa-heart': true,
							'active': hasLike
						}"
						@click="setLike"
					></i>
				</div>

				<slot name="offer" v-if="$slots.offer"></slot>

				<div class="info" v-if="item.time || item.geohash">
					<slot name="info" v-if="$slots.info && !(hasRelay || isRemoved)"></slot>
					<ul v-else>
						<template v-if="hasRelay">
							<!-- Relay -->
							<li>
								<dl :class="item.status">
									<dt><i class="fa fa-spinner fa-spin"></i></dt>
									<dd>{{ $t(`itemLabels.${ item.published }`) }}</dd>
								</dl>
							</li>
						</template>
						
						<template v-else>
							<!-- Date/Distance -->
							<li v-if="item.time">
								<time :class="item.status">{{ $d(item.time, 'middle', $i18n.locale) }}</time>
							</li>
							<li v-if="distance > -1">
								{{ distance }} {{ $t('metricsLabels.km') }}
							</li>
						</template>
					</ul>
				</div>
			</div>
		</template>

		<!-- View: Page -->
		<template v-if="vType === 'page'">
			<picture
				v-if="images?.length"
				ref="picture"
			>
				<ul class="fade">
					<li
						v-for="(image, index) in images"
						:key="image"
						:class="{ 'active': active === index }"
						@click="imageClick(index)"
					>
						<!-- First image -->
						<image-load v-if="index === 0">
							<!-- Image -->
							<template #image>
								<img
									:src="imageUrl(images[0])"
									:alt="item.caption"
								>
							</template>

							<!-- Loader -->
							<template #loader>
								<loader type="circular" />
							</template>

							<template #error>
								<div class="img-error">
									<i class="fa fa-times-circle"></i>
								</div>
							</template>
						</image-load>

						<!-- Next images -->
						<div class="image" v-else>
							<img
								:src="imageUrl(image)"
								:alt="`${ item.caption }#${ index+1 }`"
							>
						</div>
					</li>
				</ul>
				<ul
					class="thumbnails"
					v-if="images?.length > 1"
				>
					<li
						v-for="(image, index) in images"
						:key="image"
						:class="{ 'active': active === index }"
						@click="() => active = index"
					>
						<img
							:src="imageUrl(image)"
							:alt="`${ item.caption }#${ index+1 }`"
						>
					</li>
				</ul>
			</picture>

			<div class="row d-sep sided">
				<div class="col no-offset wrap">
					<ul class="stat">
						<li
							v-if="item.time"
							:class="item.status"
						>
							<i class="fa fa-calendar-day"></i>
							<time>{{ $d(item.time, 'middle', $i18n.locale) }}</time>
						</li>
						<!-- <li>
							<i class="fa fa-heart"></i>
							<span class="count">32</span>
						</li> -->
					</ul>

					<div
						v-if="item.status === 'outdated'"
						:class="`warn ${ item.status }`"
					>
						<i class="fa fa-exclamation-triangle"></i>
						<p>{{ $t('barterLabels.outdated') }}</p>
					</div>
				</div>

				<div class="col buttons">
					<v-button 
						vType="stroke bulma-color bulma-color-hover"
						@click="setLike"
					>
						<i
							:class="{
								'fa fa-heart': true,
								'active': hasLike
							}"
						></i>
					</v-button>

					<v-button 
						vType="stroke bulma-color bulma-color-hover"
						@click="shareItem"
					>
						<i class="fa fa-share-alt"></i>
					</v-button>
				</div>
			</div>

			<!-- without sidebar -->
			<div class="row block sep no-sidebar">
				<Caption :item="item"/>
				<Price :item="item"/>
			</div>

			<div class="row block sep">
				<ExchangeList
					:title="$t('barterLabels.exchange')"
					:tags="exchangeList.map(l => l.id)"
					:visible="0 /* Means show all items without toggle */"
				/>
			</div>

			<!-- Pickup point data -->
			<div 
				v-if="pickupPoint"
				id="pickup-point-info"
				class="row block sep"
			>
				<strong class="title">{{ $t('deliveryLabels.pickup_point_info') }}</strong>

				<div class="row block">
					<strong class="subtitle">{{ $t('deliveryLabels.financial_terms') }}</strong>
					<p class="description">{{ pickupPoint.financialTerms }}</p>
				</div>

				<div class="row block">
					<strong class="subtitle">{{ $t('deliveryLabels.shelf_life') }}</strong>
					<p class="description">{{ $t('deliveryLabels.default_shelf_life_value') }}</p>
				</div>

				<div class="row block">
					<strong class="subtitle">{{ $t('deliveryLabels.work_schedule') }}</strong>
					<work-schedule
						mode="view"
						:workSchedule="pickupPoint.workSchedule"
					/>
				</div>

				<div class="row block">
					<strong class="subtitle">{{ $t('deliveryLabels.address') }}</strong>
					<p class="description">{{ pickupPoint.address }}</p>
				</div>

				<div class="row block">
					<strong class="subtitle">{{ $t('deliveryLabels.how_to_get') }}</strong>
					<p class="description">{{ pickupPoint.route }}</p>
				</div>
			</div>

			<div class="row block sep" v-if="item.description">
				<strong class="title">{{ $t('stepsLabels.description') }}</strong>
				<p class="description">{{ item.description }}</p>
			</div>

			<div
				class="row info"
				v-if="geohash"
			>
				<div class="col">
					<span class="title">{{ $t('stepsLabels.location') }}</span>
					<ul>
						<li v-if="geopos">
							<address>{{ geopos }}</address>
						</li>
						<li v-if="distance > -1">{{ distance }} {{ $t('metricsLabels.km') }}</li>
					</ul>
				</div>
			</div>

			<div
				class="row"
				:class="{ 'sep': deliveryOptions }"
				v-if="item.geohash"
			>
				<!-- Component: Map -->
				<v-map
					ref="map"
					:mapMode="mapMode"
					:height="(mapMode === 'deliverySelection') ? mapHeight() : undefined"
					:pickupPointPopupMode="isMyOffer ? 'readonly' : 'selection'"
					:center="geohash"
					:zoom="10"
					:offers="mapOffers()"
					:selectedOfferIds="selectedOfferIds()"
					@errorEvent="mapErrorEvent"
					@selectPickupPoint="selectPickupPoint"
					@buyAtPickupPoint="buyAtPickupPoint"
				/>
			</div>

			<!-- Delivery options data -->
			<div 
				v-if="deliveryOptionsAvailable"
				id="delivery-options-info"
				class="row block"
			>
				<strong class="title">{{ $t('deliveryLabels.label') }}</strong>

				<PickupPointList
					ref="pickupPointList"
					id="pickup-point-list"
					:mode="isMyOffer ? 'readonly' : 'selection'"
					:compactView="true"
					:items="pickupPointItems"
					:selectedOfferIds="selectedOfferIds()"
					:loaderState="pickupPointsLoading"
					:loaderItems="pickupPointsLoadingCount"
					:loadingError="pickupPointsLoadingError"
					@repeatLoading="pickupPointsRepeatLoading"
					@selectItem="selectPickupPoint"
					@buyAtItem="buyAtPickupPoint"
				/>

				<label
					v-if="purchaseStateLabel.isEnabled"
					class="v-label warning-level no-sidebar"
				>
					<i :class="purchaseStateLabel.iconClass"></i>
					{{ $t(purchaseStateLabel.i18nKey) }}
				</label>

			</div>

			<!-- without sidebar -->
			<div class="row block top-sep no-sidebar">
			</div>

			<!-- without sidebar -->
			<div class="row block sep no-sidebar" v-if="!isMyOffer">
				<Profile :hash="address" />
			</div>

			<!-- without sidebar -->
			<div class="row block no-sidebar">
				<!-- My offer -->
				<MyOptions
					v-if="isMyOffer"
					:item="item"
					@withdrawOffer="withdrawOfferDialog(item, false)"
					@renewOffer="renewOfferDialog(item)"
					@removeOffer="withdrawOfferDialog(item, true)"
				/>

				<!-- Someone's offer -->
				<BarterExchange
					v-if="!isMyOffer"
				/>
			</div>

			<!-- Legal info -->
			<div 
				v-if="legalInfoAvailable"
				class="row block top-sep"
			>
				<strong class="title">{{ $t('legalLabels.label') }}</strong>
				<LegalInfo
					:i18nDocumentKeys="requiredLegalInfoItemKeys"
				/>
			</div>
		</template>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>