<template>
	<nav class="categories-hierarchy-list">
		<menu>
			<!-- Home page -->
			<menuitem class="parent-category">
				<router-link :to="{ name: 'home' }">
					<i class="fa fa-angle-left"></i>
					{{ $t("pageLabels.home") }}
				</router-link>
			</menuitem>

			<!-- Parent categories -->
			<template
				v-for="item in parentCategories"
			>
				<menuitem
					:key="item.id"
					class="parent-category"
				>
					<router-link :to="{ name: 'category', params: { id: item.id } }">
						<i class="fa fa-angle-left"></i>
						{{ $t(item.name) }}
					</router-link>
				</menuitem>
			</template>

			<!-- Current category -->
			<menuitem class="current-category">
				<a href="#">
					{{ $t(currentCategory.name) }}
				</a>
			</menuitem>

			<!-- Sub categories -->
			<template
				v-for="(item, index) in subCategories"
			>
				<menuitem
					v-if="!expandedState && index < defaultVisibleCount || expandedState"
					:key="item.id"
					class="sub-category"
				>
					<router-link :to="{ name: 'category', params: { id: item.id } }">
						{{ $t(item.name) }}
						<i 
							v-if="item.children?.length"
							class="fa fa-angle-right"
						></i>
					</router-link>
				</menuitem>
			</template>
		</menu>

		<button
			v-if="countToShow > 0"
			class="toggle"
			@click="toggleExpandedState"
		>
			<template v-if="!expandedState">
				{{ $t('toggleLabels.show_all') }} ({{ countToShow }})
			</template>
			<template v-else>
				<div>
					{{ $t('toggleLabels.hide') }}
				</div>
			</template>
		</button>
	</nav>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>