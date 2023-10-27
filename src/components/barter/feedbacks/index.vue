<template>
	<div :class="{
		'row block t-sep': form,
		'feedbacks': true
	}">
		<v-form v-if="form">
			<v-textarea
				ref="feedback"
				class="field"
				name="feedback"
				length="9000"
				:placeholder="$t('feedbacks.placeholder')"
			>
				<template #after>
					<div class="buttons">
						<v-button
							vType="transparent"
							vSize="sm"
							class="submit"
						>
							<i class="fa fa-paper-plane"></i>
						</v-button>
					</div>
				</template>
			</v-textarea>
		</v-form>

		<ul v-if="items.length">
			<li></li>
		</ul>
		<span v-else>{{ $t('feedbacks.empty') }}</span>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>