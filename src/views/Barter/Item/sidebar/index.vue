<template>
	<v-sidebar>
		<div class="box">
			<h1 class="title">{{ item.name }}</h1>
			<span class="price">
				<span class="currency pkoin"></span> {{ item.price }}
			</span>

			<div class="row t-sep">
				<BarterExchange :item="item" :items="barters.generate(8)" />
			</div>
		</div>

		<div class="box">
			<Profile />
			<ExchangeList>
				<template #edit>
					<dl class="list">
						<dt>#</dt>
						<dd>{{ item.id }}</dd>
					</dl>

					<a class="report" href="#"><i class="fa fa-flag"></i> {{ $t('profile.report_abuse') }}</a>
				</template>
			</ExchangeList>
		</div>
	</v-sidebar>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>