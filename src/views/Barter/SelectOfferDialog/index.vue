<template>
	<v-lightbox
		class="select-offer-dialog"
		size="md"
		:visible="lightbox"
		:title="dialogTitle"
		@onHide="hide"
	>
		<ul>
			<li
				v-for="(item, index) in items"
				:key="index"
				:class="{ 'selected': selected === index }"
				@click="() => selected = index"
			>
				<i class="fa fa-check-circle"></i>
				<img :src="imageUrl(item.images[0])" :alt="item.name">
			</li>
		</ul>

		<!-- Footer -->
		<template #footer>
			<div class="row full-width right">
				<div class="buttons-holder min-h-w">
					<v-button
						:disabled="!items[selected]"
						@click="select"
					>
						<span>{{ selectButtonTitle }}</span>
					</v-button>
				</div>
			</div>
		</template>
	</v-lightbox>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>