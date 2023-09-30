<template>
	<div :class="{ [`barter-item-${ vType }`]: true }">
		<!-- Picture -->
		<picture v-if="item.images?.length && vType !== 'item'">
			<router-link :to="{ name: 'barterItem', params: { id: item.hash } }">
				<span class="state">{{ $t(`condition.${ !item.used ? 'new' : 'used' }`) }}</span>
			
				<img
					v-if="item.images?.length < 2"
					:src="imageUrl(item.images[0])"
					:alt="item.name"
				>
				<template v-else>
					<ul class="slide">
						<li
							v-for="(image, index) in item.images"
							:key="index"
							:class="{ 'hover': hover === index }"
							@mouseenter="() => hover = index"
							@mouseleave="() => hover = 0"
						>
							<img
								:src="imageUrl(image)"
								:alt="`${ item.name }#${ index+1 }`"
							>
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
			<div class="row pricing" v-if="item.price">
				<span class="price">
					<span class="currency pkoin"></span>
					{{ $n(item.price) }}
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
							<dd><time>{{ $d(item.time * 1000, 'middle') }}</time></dd>
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

				<div class="pricing" v-if="item.price">
					<span class="price">
						<span class="currency pkoin"></span>
						{{ $n(item.price) }}
					</span>
				</div>
			</div>

			<div class="row offer">
				<div class="favorite">
					<i class="fa fa-heart"></i>
				</div>

				<slot name="offer"></slot>

				<div class="info" v-if="item.time || item.geohash">
					<ul>
						<li v-if="item.time">
							<time>{{ $d(item.time * 1000, 'middle') }}</time>
						</li>
						<li v-if="distance > -1">
							{{ distance }} {{ $t('metrics.km') }}
						</li>
					</ul>
				</div>
			</div>
		</template>

		<!-- View: Item (On page) -->
		<template v-if="vType === 'item'">
			<picture v-if="item.images">
				<img
					v-if="item.images?.length < 2"
					:src="imageUrl(item.images[0])"
					:alt="item.name"
				>
				<template v-else>
					<ul class="fade">
						<li
							v-for="(image, index) in item.images"
							:key="index"
							:class="{ 'active': active === index }"
						>
							<img
								:src="imageUrl(image)"
								:alt="`${ item.name }#${ index+1 }`"
							>
						</li>
					</ul>
					<ul
						class="thumbnails"
						v-if="item.images?.length"
					>
						<li
							v-for="(image, index) in item.images"
							:key="index"
							:class="{ 'active': active === index }"
							@click="() => active = index"
						>
							<img
								:src="imageUrl(image)"
								:alt="`${ item.name }#${ index+1 }`"
							>
						</li>
					</ul>
				</template>
			</picture>

			<div class="row d-sep sided">
				<div class="col no-offset">
					<ul class="stat">
						<li v-if="item.time">
							<i class="fa fa-calendar-day"></i>
							<time>{{ $d(item.time * 1000, 'middle') }}</time>
						</li>
						<li>
							<i class="fa fa-eye"></i>
							<span class="count">32</span>
						</li>
					</ul>
				</div>

				<div class="col buttons">
					<v-button vType="stroke bulma-color">
						<i class="fa fa-heart"></i>
					</v-button>

					<v-button vType="stroke bulma-color">
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
							<address>{{ address.city || address.county }}, {{ address.country }}</address>
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