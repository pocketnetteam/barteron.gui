<template>
	<div class="safe-deal-status">
		<div v-if="statusesLoading">
			<loader 
				type="circular" 
				align="top"
			/>
		</div>

		<div v-if="statusesLoadingError">
			<label
				class="v-label error-level"
			>
				<i class="fa fa-info-circle"></i>
				{{ $t("safeDealLabels.status_loading_error_short_message") }}
			</label>
		</div>

		<div v-if="!(statusesLoading || statusesLoadingError)">
			<ul class="items-holder">
				<li
					v-for="(item, index) in items"
					:key="item"
				>
					<div class="item-with-line">
						<div class="item">
							<div class="marker">
								<i 
									class="fa"
									:class="{
										[`fa-${ statusIcon(item) }`]: true,
										'checked': statusChecked(item),
										'negative': statusNegative(item),
									}"
								></i>
							</div>
							<div 
								:class="{
									'title': true,
									'checked': statusChecked(item),
								}"
							>{{ statusTitle(item) }}</div>
						</div>

						<div 
							v-if="index < items.length - 1"
							class="line-holder"
						>
							<div 
								:class="{
									'line': true,
									'checked': nextStatusChecked(item),
									'negative': statusNegative(item),
								}"
							></div>
						</div>
					</div>
				</li>
			</ul>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>