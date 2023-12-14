<template>
	<v-lightbox
		class="categories-select"
		size="md"
		ref="lightbox"
		:title="$t('categoriesLabels.choose')"
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
						keydown: search,
						change: change,
						input: change
					}"
				>
					<template #input0After>
						<i
							:class="{
								'action fa': true,
								'fa-search': !changed,
								'fa-times': changed
							}"
							@click="search"
						></i>
					</template>
				</v-input>
			</div>

			<!-- Found -->
			<div class="found" v-if="query">
				<p v-if="results.length">{{
					$t('searchLabels.found', {
						count: results.length,
						results: $t(`searchLabels.result${ results.length > 1 ? 's' : '' }`)
					})
				}}</p>
				<p v-else>{{ $t('searchLabels.not_found') }}</p>
			</div>
		</template>

		<!-- Main -->
		<template #default>
			<!-- Loader -->
			<template v-if="searching">
				<div class="searching">
					<Loader type="circular" />
				</div>
			</template>

			<template v-else-if="!searching && !results.length">
				<!-- History -->
				<ul
					class="history"
					v-if="expanded?.history?.length"
				>
					<!-- Root item -->
					<li class="root">
						<a @click="expand(null)">{{ $t('categoriesLabels.label') }}</a>
					</li>

					<!-- Dynamic items -->
					<li
						v-for="(parent, index) in expanded?.history"
						:key="index"
					>
						<a
							v-if="index < expanded.history.length - 1"
							@click="expand(parent.id)"
						>{{ $t(parent.name) }}</a>
						<span v-else>{{ $t(parent.name) }}</span>
					</li>
				</ul>

				<!-- Categories -->
				<ul
					class="categories"
					v-if="expanded?.id ? expanded?.children?.length : root.length"
				>
					<!-- Children -->
					<li
						v-for="(category, index) in expanded?.children || root"
						:key="index"
					>
						<v-button
							:class="{ marked: isMarked(category.id) }"
							vType="beerus-stroke bulma-color"
							@click="expand(category.id)"
						>
							<i
								:class="`fa ${ category.icon }`"
								v-if="category.icon"
							></i>
							<span>{{ $t(category.name) }}</span>
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
							<summary class="text">
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
								class="history"
								v-if="category.history?.length"
							>
								<li
									v-for="(parent, index) in category.history"
									:key="index"
								>
									<a @click="expand(parent.id)">{{ $t(parent.name) }}</a>
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
						:disabled="!expanded || isMarked(expanded.id)"
						@click="select"
					>{{ $t('categoriesLabels.select') }}</v-button>
				</div>
			</div>
		</template>
	</v-lightbox>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>