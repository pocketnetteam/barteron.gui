<template>
	<div class="user-bar">
		<ul>
			<li>
				<router-link :to="{ path: `/profile/${ sdk.address }#favorites` }" class="link">
					<i class="fa fa-heart"></i>
				</router-link>
			</li>

			<li>
				<router-link :to="{ path: `/profile/${ sdk.address }#feedbacks` }" class="link">
					<i class="fa fa-comment"></i>
				</router-link>
			</li>

			<li>
				<router-link class="avatar" :to="{ name: 'profile', params: { id: sdk.address } }">
					<i
						v-if="!user?.i"
						:style="hslColor"
					>{{ shortName }}</i>
					
					<picture v-else>
						<img :src="user?.i" :alt="user?.name">
					</picture>
				</router-link>
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