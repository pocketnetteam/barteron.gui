<template>
	<v-aside>
		<!-- Profile stats -->
		<div class="box profile">
			<div class="row author">
				<div class="col">
					<picture class="status-online">
						<img src="@/assets/images/avatar.png" alt="avatar">
					</picture>
				</div>

				<div class="col user">
					<ul class="list">
						<li>
							<strong class="label">Username</strong>
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
			<div class="row edit">
				<v-button vType="stroke-bulma">
					{{ $t('profile.edit') }}
				</v-button>
			</div>

			<!-- Profile info -->
			<div class="row info">
				
			</div>
		</div>
	</v-aside>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>