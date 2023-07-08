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
				<dl class="list">
					<dt><i class="fa fa-calendar-day"></i></dt>
					<dd>{{
					$t('profile.on_barteron_from', { date: $d(1630073595000, 'middle') })
					}}</dd>
					<dt><i class="fa fa-map-marker-alt"></i></dt>
					<dd>Astana, Kazakhstan</dd>
				</dl>
			</div>

			<!-- Account state -->
			<div class="row state">
				<dl class="list">
					<dt><i class="fa fa-user-shield"></i></dt>
					<dd>{{ $t('profile.account_confirmed') }}</dd>
				</dl>

				<a class="ask" href="#"><i class="fa fa-question"></i></a>
			</div>
		</div>

		<!-- Wallet -->
		<div class="box wallet">
			<dl class="list">
				<dt><i class="fa fa-wallet"></i></dt>
				<dd>
					<strong>13 465</strong>
					<span>{{ $t('profile.coins') }}</span>
				</dd>
			</dl>

			<v-button>{{ $t('profile.wallet') }}</v-button>
		</div>

		<!-- Exchange -->
		<div class="box exchange">
			<strong class="title">{{ $t('barterLabels.to') }}:</strong>

			<!-- Tags -->
			<ul class="list">
				<li>Electronics</li>
				<li>Dress</li>
				<li>Shoes</li>
				<li>Beauty & Health</li>
				<li>Sport & Recreation</li>
			</ul>

			<!-- Toggle -->
			<div class="toggle">
				<a href="#" class="link">
					{{ $t(`category.${ 'show' || 'hide' }_all`) }}
				</a>
			</div>

			<!-- Tags edit -->
			<v-button vType="stroke-bulma">
				{{ $t('exchange.edit') }}
			</v-button>
		</div>

		<!-- Settings -->
		<div class="settings">
			<ul class="list">
				<li><a href="#" class="link"><i class="fa fa-cog"></i> {{ $t('profile.settings') }}</a></li>
				<li><a href="#" class="link"><i class="fa fa-question-circle"></i> {{ $t('profile.contact_support') }}</a></li>
			</ul>
		</div>
	</v-aside>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>