<template>
	<v-content 
		v-if="address && userHasAccess"
		class="safe-deal-content"
	>
		<strong class="subtitle">
			{{ actionsListTitle }}
		</strong>

		<div v-if="actionsList.length">
			<ul class="actions-list">
				<li 
					v-for="value in actionsList"
					:key="value"
				>
					<span>{{ value }}</span>
				</li>
			</ul>
		</div>

		<div v-if="infoList.length">
			<div class="info-list">
				<label
					v-for="value in infoList"
					class="v-label info-level"
				>
					<i class="fa fa-info-circle"></i>
					{{ value }}
				</label>
			</div>
		</div>


	</v-content>

	<v-content v-else>
		<section>
			<p>{{ $t('safeDealLabels.user_has_no_access') }}</p>
		</section>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>