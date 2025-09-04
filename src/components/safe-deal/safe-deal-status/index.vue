<template>
	<div class="safe-deal-status">
		<div>
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
									'checked': statusChecked(item),
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