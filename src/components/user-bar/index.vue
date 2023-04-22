<template>
	<div class="user-bar">
		<ul>
			<li>
				<router-link :to="{ name: 'home' }" class="link">
					<i class="fa fa-heart"></i>
				</router-link>
			</li>

			<li>
				<router-link :to="{ name: 'home' }" class="link">
					<i class="fa fa-comment"></i>
				</router-link>
			</li>

			<li>
				<div class="avatar">UN</div>
			</li>

			<li>
				<v-button :to="{ name: 'createBarter' }">
					<i class="fa fa-plus"></i>
					<span>Create barter</span>
				</v-button>
			</li>
		</ul>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>