<template>
	<div :class="{ 'exchange': true, [`v-list-${ vSize }`]: true }">
		<div class="before" v-if="$slots.before || $scopedSlots.before">
			<slot name="before" :instance="instance"></slot>
		</div>

		<div class="v-list-holder" :class="holderClass">
			<strong class="title" v-if="title">{{ $t('barterLabels.label') }}:</strong>

			<slot v-if="$slots.default || $scopedSlots.default" :instance="instance"></slot>

			<!-- Tags -->
			<ul class="list">
				<li
					v-for="(id, index) in !editing ? vTags.slice(0, show) : vTags"
					:key="index"
				>
					{{ $te(categories.items[id]?.name) ? $t(categories.items[id]?.name) : $t('buttonLabels.unknown') }}
					<i
						v-if="editing"
						class="fa fa-times remove"
						@click="remove(index)"
					></i>
				</li>

				<!-- Empty list -->
				<li class="empty" v-if="!vTags.length && !editing">
					{{ $t('barterLabels.empty') }}
				</li>

				<!-- Toggle list -->
				<li class="toggle" v-if="!editing && vTags.length > visible">
					<a
						class="link"
						href="#"
						@click.prevent="toggle"
					>
						{{ $t(`toggleLabels.${ show < vTags.length ? 'show_all' : 'hide' }`) }}
					</a>
				</li>

				<!-- Insert tag -->
				<li
					class="add"
					v-if="editing"
					@click="$refs.categorySelect.show()"
				>
					<i class="fa fa-plus"></i>
				</li>
			</ul>

			<CategorySelect
				ref="categorySelect"
				:marked="vTags"
				@selected="insert"
			/>

			<!-- Tags edit -->
			<div class="edit" v-if="editable">
				<slot
					name="edit"
					:instance="instance"
					v-if="$slots.edit || $scopedSlots.edit"
				></slot>
				
				<template v-else>
					<!-- Edit button -->
					<v-button
						@click="edit"
						:vHtml="editText"
						v-if="!editing"
					/>

					<!-- Cancel and Save buttons -->
					<div class="buttons-holder" v-else>
						<v-button
							vType="chi-chi"
							:vHtml="cancelText"
							@click="cancel"
						/>

						<v-button
							:vHtml="saveText"
							@click="save"
						/>
					</div>
				</template>
			</div>
		</div>

		<div class="after" v-if="$slots.after || $scopedSlots.after">
			<slot name="after" :instance="instance"></slot>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>