<template>
	<v-lightbox
		class="useful-tips-dialog"
		size="md"
		:visible="lightbox"
		:title="$t('usefulTipsLabels.label')"
		@onHide="hide"
	>
		<div 
			v-for="section in tips.sections"
			:key="section.title"
			class="section-holder"
		>
			<h1 class="section">{{ section.title }}</h1>

			<div 
				v-for="chapter in section.chapters"
				:key="chapter.title"
			>
				<h2 class="chapter">{{ chapter.title }}</h2>

				<ul>
					<li
						v-for="item in chapter.items"
						:key="item.text"
						class="item"
					>{{ item.text }}</li>
				</ul>
			</div>
		</div>

		<!-- Footer -->
		<template #footer>
			<div class="row full-width right">
				<div class="buttons-holder min-h-w">
					<v-button 
						@click="hide"
					>
						<span>{{ $t('buttonLabels.close') }}</span>
					</v-button>
				</div>
			</div>
		</template>
	</v-lightbox>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>