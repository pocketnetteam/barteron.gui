<template>
	<div class="barter-item-page details">
		<!-- Gallery -->
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

		<!-- Caption -->
		<div class="row block t-sep" v-if="item.caption">
			<strong class="subtitle">{{ item.caption }}</strong>
		</div>

		<!-- Price -->
		<div class="info">
			<div class="col">
				<span class="title">{{ $t('priceLabels.label') }}</span>
				<Price :item="item" />
			</div>
		</div>

		<div class="row block sep"></div>

		<!-- Delivery fields -->
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

		<!-- Description -->
		<div class="row block sep" v-if="item.description">
			<strong class="title">{{ $t('stepsLabels.description') }}</strong>
			<p class="description">{{ item.description }}</p>
		</div>

		<!-- Distance -->
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

		<!-- Map -->
		<div
			class="row"
			:class="{ 'sep': false }"
			v-if="item.geohash"
		>
			<!-- Component: Map -->
			<v-map
				mapMode="view"
				:center="geohash"
				:zoom="10"
				:offers="[item]"
			/>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>