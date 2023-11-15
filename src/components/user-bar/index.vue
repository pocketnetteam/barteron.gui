<template>
	<div class="user-bar">
		<ul>
			<li>
				<a
					class="link"
					@click="$event => requestAccount($event, { name: 'profile', params: { id: `${ address }#favorites` } })"
				>
					<i class="fa fa-heart"></i>
			</a>
			</li>

			<li>
				<a
					class="link"
					@click="$event => requestAccount($event, { name: 'profile', params: { id: `${ address }#feedbacks` } })"
				>
					<i class="fa fa-comment"></i>
			</a>
			</li>

			<li>
				<a
					class="avatar"
					@click="$event => requestAccount($event, { name: 'profile', params: { id: address } })"
				>
					<i
						v-if="!user?.i"
						:style="hslColor"
					>{{ shortName }}</i>
					
					<picture v-else>
						<img :src="user?.i" :alt="user?.name">
					</picture>
				</a>
			</li>

			<li>
				<v-button @click="$event => requestAccount($event, { name: 'createBarter' })">
					<i class="fa fa-plus"></i>
					<span>Create barter</span>
				</v-button>
			</li>
		</ul>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>