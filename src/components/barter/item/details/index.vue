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

		<!-- Price -->
		<div class="info">
			<div class="col">
				<span class="title">{{ $t('priceLabels.label') }}</span>
				<Price :item="item" />
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
			:class="{ 'sep': item.delivery?.length }"
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