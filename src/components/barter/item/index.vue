<template>
	<div :class="{ [`barter-item-${ vType }`]: true }">
		<!-- Picture -->
		<picture v-if="item.images?.length && vType !== 'page'">
			<router-link :to="{ name: 'barterItem', params: { id: item.hash } }">
				<span class="state">{{ $t(`condition.${ !item.used ? 'new' : 'used' }`) }}</span>
			
				<!-- Images -->
				<template>
					<ul class="slide">
						<li
							v-for="(image, index) in item.images"
							:key="index"
							:class="{ 'hover': hover === index }"
							@mouseenter="() => hover = index"
							@mouseleave="() => hover = 0"
						>
							<!-- First image -->
							<image-load v-if="index === 0">
								<!-- Image -->
								<template #image>
									<img
										:src="imageUrl(item.images[0])"
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
						v-if="item.images?.length > 1"
					>
						<li
							v-for="(image, index) in item.images"
							:key="index"
							:class="{ 'hover': hover === index }"
							@mouseenter="() => hover = index"
							@mouseleave="() => hover = 0"
						>{{ index }}</li>
					</ul>
				</template>
			</router-link>
		</picture>

		<!-- View: Tile -->
		<template v-if="vType === 'tile'">
			<div class="row pricing">
				<span class="price">
					<template v-if="item.price">
						<span class="currency pkoin"></span>
						{{ $n(item.price) }}
					</template>
					<template v-else>
						<span class="currency fa fa-gift"></span>
						{{ $t('barterLabels.free') }}
					</template>
				</span>

				<span class="favorite">
					<slot name="favorite" v-if="$slots.favorite"></slot>
					<i class="fa fa-heart" v-else></i>
				</span>
			</div>

			<div class="row title" v-if="item.caption">
				<span>{{ item.caption }}</span>
			</div>

			<div class="row to" v-if="exchangeList.length">
				<ul>
					<li><span>{{ $t('barterLabels.to') }}: </span></li>
					<li
						v-for="(link, index) in exchangeList"
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
				<slot name="info" v-if="$slots.info"></slot>
				<ul v-else>
					<li v-if="item.time">
						<dl>
							<dt><i class="fa fa-calendar"></i></dt>
							<dd><time>{{ $d(item.time, 'middle') }}</time></dd>
						</dl>
					</li>
					<li v-if="distance > -1">
						{{ distance }} {{ $t('metrics.km') }}
					</li>
				</ul>
			</div>

			<div class="row offer" v-if="$slots.offer">
				<slot name="offer"></slot>
			</div>
		</template>

		<!-- View: Row -->
		<template v-if="vType === 'row'">
			<div class="row">
				<div>
					<span class="title" v-if="item.caption">{{ item.caption }}</span>

					<div class="to" v-if="exchangeList.length">
						<ul>
							<li><span>{{ $t('barterLabels.to') }}: </span></li>
							<li
								v-for="(link, index) in exchangeList"
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
							<span class="currency pkoin"></span>
							{{ $n(item.price) }}
						</template>
						<template v-else>
							<span class="currency fa fa-gift"></span>
							{{ $t('barterLabels.free') }}
						</template>
					</span>
				</div>
			</div>

			<div class="row offer">
				<div class="favorite">
					<i class="fa fa-heart"></i>
				</div>

				<slot name="offer"></slot>

				<div class="info" v-if="item.time || item.geohash">
					<slot name="info" v-if="$slots.info"></slot>
					<ul v-else>
						<li v-if="item.time">
							<time>{{ $d(item.time, 'middle') }}</time>
						</li>
						<li v-if="distance > -1">
							{{ distance }} {{ $t('metrics.km') }}
						</li>
					</ul>
				</div>
			</div>
		</template>

		<!-- View: Page -->
		<template v-if="vType === 'page'">
			<picture
				v-if="item.images"
				ref="picture"
			>
				<ul class="fade">
					<li
						v-for="(image, index) in item.images"
						:key="index"
						:class="{ 'active': active === index }"
						@mouseenter="imageZoom"
						@mousemove="imageZoom"
						@mouseleave="imageZoom"
					>
						<!-- First image -->
						<image-load v-if="index === 0">
							<!-- Image -->
							<template #image>
								<img
									:src="imageUrl(item.images[0])"
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
					v-if="item.images?.length > 1"
				>
					<li
						v-for="(image, index) in item.images"
						:key="index"
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
				<div class="col no-offset">
					<ul class="stat">
						<li v-if="item.time">
							<i class="fa fa-calendar-day"></i>
							<time>{{ $d(item.time, 'middle') }}</time>
						</li>
						<li>
							<i class="fa fa-heart"></i>
							<span class="count">32</span>
						</li>
					</ul>
				</div>

				<div class="col buttons">
					<v-button vType="stroke bulma-color bulma-color-hover">
						<i class="fa fa-heart"></i>
					</v-button>

					<v-button vType="stroke bulma-color bulma-color-hover">
						<i class="fa fa-share-alt"></i>
					</v-button>
				</div>
			</div>

			<div class="row block sep" v-if="item.description">
				<strong class="title">{{ $t('steps.description') }}</strong>
				<p class="description">{{ item.description }}</p>
			</div>

			<div class="row info" v-if="geohash">
				<div class="col">
					<span class="title">Location</span>
					<ul>
						<li v-if="address">
							<address>{{ address }}</address>
						</li>
						<li v-if="distance > -1">{{ distance }} {{ $t('metrics.km') }}</li>
					</ul>
				</div>
			</div>

			<div class="row" v-if="item.geohash">
				<!-- Component: Map -->
				<v-map
					:center="geohash"
					:point="geohash"
					:allowPosition="true"
				/>
			</div>
		</template>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>