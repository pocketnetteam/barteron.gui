<template>
	<div :class="{ [`barter-item-${ vType }`]: true }">
		<!-- Picture -->
		<picture v-if="item.image">
			<span class="state">{{ item.used ? 'I/U' : 'New' }}</span>
			
			<img
				v-if="!Array.isArray(item.image)"
				:src="imageUrl(item.image)"
				:alt="item.title"
			>
			<template v-else>
				<ul class="slide">
					<li
						v-for="(image, index) in item.image"
						:key="index"
						:class="{ 'hover': hover === index }"
						@mouseenter="hoverize(index)"
						@mouseleave="hoverize(0)"
					>
						<img
							:src="imageUrl(image)"
							:alt="`${ item.title }#${ index+1 }`"
						>
					</li>
				</ul>
				<ul
					class="bullets"
					v-if="item.image.length > 1"
				>
					<li
						v-for="(image, index) in item.image"
						:key="index"
						:class="{ 'hover': hover === index }"
						@mouseenter="hoverize(index)"
						@mouseleave="hoverize(0)"
					>{{ index }}</li>
				</ul>
			</template>
		</picture>

		<!-- View: Tile -->
		<template v-if="vType === 'tile'">
			<div class="row pricing" v-if="item.price">
				<span class="price">
					<span class="currency pkoin"></span>
					{{ formatCurrency({ value: item.price }) }}
				</span>
				<span class="favorite">
					<i class="fa fa-heart"></i>
				</span>
			</div>

			<div class="row title" v-if="item.name">
				<span>{{ decodeString(item.name) }}</span>
			</div>

			<div class="row to" v-if="item.to">
				<ul>
					<li
						v-for="(link, index) in [$t('barterLabels.to')].concat(getCategories(item.to))"
						:key="index"
					>
						<span v-if="!link.name">{{ link }}: </span>
						<router-link v-else
							:to="{ 'name': 'category', params: { slug: link.name } }"
						>{{ link.title }}</router-link>
					</li>
				</ul>
			</div>

			<div class="row info" v-if="item.published || item.location">
				<ul>
					<li v-if="item.published">
						<time>{{ item.published }}</time>
					</li>
					<li v-if="item.location">
						<address>{{ calcDistance(item.location) }}</address>
					</li>
				</ul>
			</div>
		</template>

		<!-- View: Row -->
		<template v-if="vType === 'row'">
			<div class="row" v-if="item.name">
				<div>
					<span class="title">{{ decodeString(item.name) }}</span>

					<div class="to" v-if="item.to">
						<ul>
							<li
								v-for="(link, index) in [$t('barterLabels.to')].concat(getCategories(item.to))"
								:key="index"
							>
								<span v-if="!link.name">{{ link }}: </span>
								<router-link v-else
									:to="{ 'name': 'category', params: { slug: link.name } }"
								>{{ link.title }}</router-link>
							</li>
						</ul>
					</div>
				</div>

				<div class="pricing" v-if="item.price">
					<span class="price">
						<span class="currency pkoin"></span>
						{{ formatCurrency({ value: item.price }) }}
					</span>
				</div>
			</div>

			<div class="row">
				<div class="favorite">
					<i class="fa fa-heart"></i>
				</div>

				<div class="info" v-if="item.published || item.location">
					<ul>
						<li v-if="item.published">
							<time>{{ item.published }}</time>
						</li>
						<li v-if="item.location">
							<address>{{ calcDistance(item.location) }}</address>
						</li>
					</ul>
				</div>
			</div>
		</template>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>