<template>
	<div :class="{
		score: true,
		preview: mode === 'preview',
		voteable: voteable && !voted
	}">
		<span
			:class="{
				rating: true,
				[`score-${ rating === true ? 'ahead' : rating }`]: true
			}"
			v-if="rating"
		>{{ (value || (relayMode ? 0 : score)).toFixed(1).split('.').join(delimeter) }}</span>

		<div class="stars">
			<ul>
				<li
					v-for="index in stars"
					:key="`bg-${ index }`"
				><i class="fa fa-star"></i></li>
			</ul>

			<ul
				class="padded"
				:style="{ '--r': starsValue || value || score }"
			>
				<li
					v-for="index in stars"
					:key="`fg-${ index }`"
					:class="{ voted: index <= (starsValue || score) }"
					@click="change(index)"
				><i class="fa fa-star"></i></li>
			</ul>
		</div>

		<span 
			v-if="mode === 'preview' && votesCount > 0"
			class="votes-count"
		><i class="fa fa-user"></i>{{ votesCount }}</span>
		<!-- <template v-if="mode === 'preview' && votesCount > 0">
			<i class="fa fa-user"></i>
			<span>{{ votesCount }}</span>
		</template> -->
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>