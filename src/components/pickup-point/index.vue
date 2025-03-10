<template>
	<div :class="{
		[`pickup-point-item`]: true,
		'pickup-point-item-relay': hasRelay
	}">
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
						@click="imageClick(index)"
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
			</template>
		</picture>

		<!-- View: Tile -->
		<template>
			<div class="row title" v-if="item.caption">
				{{ item.caption }}
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
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>