<template>
	<div :class="{
		[`pickup-point-item`]: true,
		'pickup-point-item-relay': hasRelay,
		'selected': isSelected && isSelectionMode && isListItemRole
	}">
		<i class="fa fa-check-circle"></i>
		
		<!-- Self pickup -->
		<div v-if="item.isSelfPickup">
			<picture class="self-pickup">
				<div class="image">
					<img
						:src="imageUrl('self-pickup.png')"
						:alt="'self-pickup'"
						@click="showItem"
					>
				</div>
			</picture>

			<div 
				class="row title"
				:title="item.caption"
				@click="showItem"
			>{{ item.caption }}</div>

			<div 
				class="row about-self-pickup-info"
				:title="aboutSelfPickupInfo"
				@click="showItem"
			>{{ aboutSelfPickupInfo }}</div>

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
						<!-- Date -->
						<li v-if="item.time">
							<dl :class="item.status">
								<dt><i class="fa fa-calendar"></i></dt>
								<dd><time>{{ $d(item.time, 'middle', $i18n.locale) }}</time></dd>
							</dl>
						</li>
					</template>
				</ul>
			</div>
		</div>

		<!-- Regular pickup point -->
		<div v-else>
			<!-- Picture -->
			<picture 
				v-if="images?.length"
			>
				<!-- Images -->
				<template>
					<ul class="slide">
						<li
							v-for="(image, index) in images"
							:key="image"
							:class="{ 'hover': hover === index }"
							@mouseenter="() => hover = index"
							@mouseleave="() => hover = 0"
							@click="showItem"
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
			</picture>

			<!-- View: Tile -->
			<template>
				<div 
					v-if="item.caption"
					class="row title"
					:title="item.caption"
					@click="showItem"
				>{{ item.caption }}</div>

				<div 
					class="row address" 
					:title="item.delivery?.pickupPoint?.address"
					@click="showItem"
				>{{ item.delivery?.pickupPoint?.address || $t('deliveryLabels.address_not_specified') }}</div>

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
							<!-- Date -->
							<li v-if="item.time">
								<dl :class="item.status">
									<dt><i class="fa fa-calendar"></i></dt>
									<dd><time>{{ $d(item.time, 'middle', $i18n.locale) }}</time></dd>
								</dl>
							</li>
						</template>
					</ul>
				</div>

				<div class="row offer" v-if="$slots.offer">
					<slot name="offer"></slot>
				</div>
			</template>
		</div>

		<div class="buttons-holder full-width action-buttons">
			<v-button
				vType="bulma-stroke"
				@click="showItem"
			>{{ $t('buttonLabels.show') }}</v-button>

			<template v-if="!(isReadonlyMode)">
				<template v-if="isInputMode">
					<v-button
						v-if="!(isSelected)"
						@click="selectItem"
					>{{ $t('buttonLabels.select') }}</v-button>

					<v-button
						v-if="isSelected"
						vType="hit-stroke"
						@click="unselectItem"
					>{{ $t('buttonLabels.cancel') }}</v-button>
				</template>

				<template v-if="isSelectionMode">
					<template v-if="isPopupRole">
						<v-button
							vType="hit"
							@click="buyAtItem"
						>{{ $t('buttonLabels.buy') }}</v-button>
					</template>

					<template v-else>
						<v-button
							v-if="!(isSelected)"
							:vType="selectionModeButtonVType"
							@click="selectItem"
						>{{ $t('buttonLabels.select') }}</v-button>

						<v-button
							v-if="isSelected"
							vType="hit"
							@click="buyAtItem"
						>{{ $t('buttonLabels.buy') }}</v-button>
					</template>
				</template>
			</template>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>