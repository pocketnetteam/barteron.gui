<template>
	<v-lightbox
		class="categories-select"
		size="md"
		ref="lightbox"
		:title="title || $t('categoriesLabels.choose')"
		:visible="visible"
		@onHide="hide"
	>
		<!-- Header -->
		<template #header>
			<!-- Search box -->
			<div class="search">
				<v-input
					ref="search"
					type="text"
					:placeholder="$t('searchLabels.label')"
					:value="query"
					:vEvents="{
						keydown: searchEvent,
						change: searchEvent,
						input: searchEvent
					}"
				>
					<template #input0After v-if="query">
						<i
							:class="{
								'action fa': true,
								'fa-times': true
							}"
							@click="clearEvent"
						></i>
					</template>
				</v-input>
			</div>

			<!-- Found -->
			<div class="found" v-if="query && changed">
				<p v-if="results.length">{{
					$tc('searchLabels.result', results.length, {
						count: results.length
					})
				}}</p>
				<p class="no-result" v-else>{{ $tc('searchLabels.result', 0) }}</p>
			</div>
		</template>

		<!-- Main -->
		<template #default>
			<!-- Loader -->
			<template v-if="searching">
				<div class="searching">
					<loader type="circular" />
				</div>
			</template>

			<template v-else-if="!searching && !results.length">
				<!-- History -->
				<div
					v-if="expanded?.history?.length" 
					class="history-holder"
				>
					<ul class="history">
						<!-- Root item -->
						<li class="root">
							<a @click="expand(null)">{{ $t('categoriesLabels.label') }}</a>
						</li>

						<!-- Dynamic items -->
						<li
							v-for="(parent, index) in expanded?.history"
							:key="index"
							:title="$t(parent.name)"
						>
							<a
								v-if="index < expanded.history.length - 1"
								@click="expand(parent.id)"
							>{{ $t(parent.name) }}</a>
							<span 
								v-else
							>{{ $t(parent.name) }}</span>
						</li>
					</ul>
				</div>

				<!-- <ul v-else-if="!(query && changed)" class="history">
					<li class="root">{{ $t('categoriesLabels.categoryNotSelected') }}</li>
				</ul> -->

				<div 
					v-else
					class="history-holder"
				>
					<ul class="history">
						<li class="root">{{ $t('categoriesLabels.categoryNotSelected') }}</li>
					</ul>
				</div>

				<!-- Categories -->
				<ul
					class="categories"
					v-if="expanded?.id ? expanded?.children?.length : root.length"
				>
					<!-- Children -->
					<li
						v-for="(category, index) in list"
						:key="index"
						:title="$t(category.name)"
					>
						<v-button
							:class="{
								active: expanded?.id ? (expanded?.id === category.id) : isMarked(category.id)
							}"
							vType="beerus-stroke bulma-color"
							@click="expand(category.id)"
						>
							<i
								:class="`fa ${ category.icon }`"
								v-if="category.icon"
							></i>
							<span>{{ $t(category.name) }}</span>
							<i
								class="expand fa fa-chevron-right"
								v-if="category.children?.length"
							></i>
						</v-button>
					</li>
				</ul>
			</template>
			
			<!-- Search results -->
			<template v-else-if="!searching && results.length">
				<ul class="results">
					<li
						v-for="(category, index) in results"
						:key="index"
						:class="index % 2 ? 'even' : 'odd'"
					>
						<!-- Match -->
						<details>
							<summary 
								class="text"
								:title="$t(category.name)"
							>
								<span
									v-html="highlightMatches($t(category.name))"
									@click="expand(category.id)"
								></span>
								<i
									class="toggle fa fa-angle-down"
									v-if="category.history.length"
								></i>
							</summary>

							<!-- Related parents -->
							<ul
								v-if="category.history?.length"
								class="history"
								:title="$t(parent.name)" 
							>
								<li
									v-for="(parent, index) in category.history"
									:key="index"
								>
									<a 
										@click="expand(parent.id)"
									>{{ $t(parent.name) }}</a>
								</li>
							</ul>
						</details>
					</li>
				</ul>
			</template>
		</template>

		<!-- Footer -->
		<template #footer>
			<div class="row full-width right">
				<div class="buttons-holder h-w">
					<v-button
						@click="select"
					>{{ $t('categoriesLabels.select') }}</v-button>
				</div>
			</div>
		</template>
	</v-lightbox>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>