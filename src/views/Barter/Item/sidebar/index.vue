<template>
	<v-sidebar>
		<div class="box">
			<h1 class="title">{{ item.caption }}</h1>
			<span class="price">
				<template v-if="item.price">
					<span class="currency pkoin"></span>
					{{ $n(item.price) }}
				</template>
				<template v-else>
					<span class="currency fa fa-gift"></span>
					{{ $t('barterLabels.free') }}
				</template>
			</span>

			<div class="row t-sep">
				<!-- My offer -->
				<template v-if="isMyOffer">
					<div class="buttons">
						<v-button :to="{ path: `/barter/edit/${ item.hash }`, params: { id: item.hash } }">
							<template v-if="item.hash !== 'draft'">
								<i class="fa fa-pen"></i>
								<span>{{ $t('buttonLabels.edit') }}</span>
							</template>
							<template v-else>
								<i class="fa fa-undo"></i>
								<span>{{ $t('buttonLabels.continue_edit') }}</span>
							</template>
						</v-button>

						<v-button vType="hit">
							<i class="fa fa-sync"></i>
							<span>{{ $t('buttonLabels.find_exchange_options') }}</span>
						</v-button>

						<template v-if="item.hash !== 'draft'">
							<v-button vType="bulma-stroke">
								<i class="fa fa-undo"></i>
								<span>{{ $t('buttonLabels.withdraw') }}</span>
							</v-button>

							<v-button vType="dodoria-stroke">
								<i class="fa fa-trash"></i>
								<span>{{ $t('buttonLabels.remove') }}</span>
							</v-button>
						</template>
					</div>
				</template>

				<!-- Someone's offer -->
				<BarterExchange
					v-else-if="myOffers.length"
					:item="item"
					:items="myOffers"
				/>
			</div>
		</div>

		<div class="box">
			<Profile :address="address" />
			<ExchangeList :tags="account?.tags || []">
				<template #edit>
					<dl class="list">
						<dt>{{ $t('metrics.number') }}</dt>
						<dd>{{ item.hash }}</dd>
					</dl>

					<a class="report" href="#"><i class="fa fa-flag"></i> {{ $t('profile.report_abuse') }}</a>
				</template>
			</ExchangeList>
		</div>
	</v-sidebar>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>