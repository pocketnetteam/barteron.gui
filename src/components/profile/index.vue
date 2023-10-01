<template>
	<div class="profile">
		<div class="row author">
			<div class="col">
				<div class="avatar">
					<i
						v-if="!user.i"
						:style="hslColor"
					>{{ shortName }}</i>
					
					<picture class="status-online" v-else>
						<img :src="user.i" :alt="user.name">
					</picture>
				</div>
			</div>

			<div class="col user">
				<ul class="list">
					<li>
						<strong class="label">{{ user?.name }}</strong>
					</li>

					<li>
						<ul class="stars">
							<li><a href="#"><i class="fa fa-star"></i></a></li>
							<li><a href="#"><i class="fa fa-star"></i></a></li>
							<li><a href="#"><i class="fa fa-star"></i></a></li>
							<li><a href="#"><i class="fa fa-star"></i></a></li>
							<li><a href="#"><i class="fa fa-star"></i></a></li>
						</ul>
					</li>

					<li>
						<span>0.0 {{ $t('rating.label').toLowerCase() }} (0 {{ $t('rating.reviews').toLowerCase() }})</span>
					</li>
				</ul>
			</div>
		</div>

		<!-- Profile edit -->
		<div class="row edit" v-if="$slots.edit">
			<slot name="edit"></slot>
		</div>

		<!-- Profile info -->
		<div class="row info">
			<dl class="list">
				<dt><i class="fa fa-calendar-day"></i></dt>
				<dd>{{
				$t('profile.on_barteron_from', { date: $d(account.time * 1000 || 0, 'middle') })
				}}</dd>
				<dt><i class="fa fa-map-marker-alt"></i></dt>
				<dd>Astana, Kazakhstan</dd>
			</dl>
		</div>

		<!-- Account state -->
		<div class="row state" v-if="$slots.state">
			<slot name="state"></slot>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>