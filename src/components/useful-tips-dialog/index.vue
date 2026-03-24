<template>
	<v-lightbox
		ref="lightbox"
		class="useful-tips-dialog"
		size="md"
		:visible="lightbox"
		:title="$t('usefulTipsLabels.label')"
		@onScroll="handleScroll"
		@onHide="hide"
	>
		<div class="link-sections">
			<div 
				v-for="section in tips.sections"
				:key="`link_${section.id}`"
				class="link-section"
			>
				<a 
					class="link" 
					href="#" 
					@click.prevent="goToLink(section.id)"
				>
					<u>{{ section.title }}</u>
				</a>

				<div class="link-chapters">
					<div 
						v-for="chapter in section.chapters"
						:key="`link_${chapter.id}`"
						class="link-chapter"
					>
						<a 
							class="link" 
							href="#" 
							@click.prevent="goToLink(chapter.id)"
						>
							<u>{{ chapter.title }}</u>
						</a>
						
					</div>
				</div>

			</div>
		</div>
		
		<div 
			v-for="section in tips.sections"
			:key="section.id"
			class="section-holder"
		>
			<h1 
				class="section"
				:id="section.id"
			>{{ section.title }}</h1>

			<div 
				v-for="chapter in section.chapters"
				:key="chapter.id"
			>
				<h2 
					class="chapter"
					:id="chapter.id"
				>{{ chapter.title }}</h2>

				<ul>
					<li
						v-for="item in chapter.items"
						:key="item.id"
						class="item"
					>{{ item.text }}</li>
				</ul>
			</div>
		</div>

		<div class="bottom-space"></div>

		<!-- Footer -->
		<template #footer>
			<v-button 
				v-show="scrollTopBtnVisible"
				ref="scrollTopBtn"
				class="scroll-top-btn"
				vSize="sm"
				vType="light"
				@click="scrollToTop"
			>
				<i class="fa fa-chevron-up"></i>
			</v-button>

			<div class="row full-width right">
				<div class="buttons-holder">
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