<template>
	<div
		class="delivery"
		v-if="isVisible"
	>
		<slot name="before"></slot>

		<!-- Delivery point checkbox and name -->
		<v-switch
			ref="switch"
			:id="entries.map(e => e.hash)"
			:selected="entries.map(e => e.checked ? e.hash : false).filter(f => f)[0]"
			:name="entries.map(e => 'delivery')"
			:type="type"
			:label="entries.map(e => $te(e.caption) ? $t(e.caption) : e.caption)"
			:value="entries.map(e => e.hash)"
			@change="e => getSelectedPoint(e)"
		>
			<template #controlBefore="{ index }">
				<div class="image">
					<!-- Delivery point image -->
					<img
						:src="entries[index]?.images?.[0]"
						:alt="$te(entries[index]?.caption) ? $t(entries[index]?.caption) : entries[index]?.caption"
					>
				</div>
			</template>

			<template #controlAfter="{ index }">
				<a
					href="#"
					class="about"
					v-if="entries[index]?.address"
					@click.prevent="showAbout(entries[index])"
				>
					<i class="fa fa-question icon"></i>
					{{ $t("deliveryLabels.details") }}
				</a>
			</template>
		</v-switch>

		<slot name="after"></slot>

		<v-lightbox
			class="about-point-dialog"
			size="md"
			:visible="about"
			:title="$t('deliveryLabels.about', { point: entry?.caption })"
			@onHide="hideAbout"
		>
			<!-- Content -->
			<PointPreview
				v-if="entry"
				:item="entry"
			/>
		</v-lightbox>
	</div>
</template>

<style scoped lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>