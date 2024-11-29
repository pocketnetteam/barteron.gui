<template>
	<div :class="{
		score: true,
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
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>