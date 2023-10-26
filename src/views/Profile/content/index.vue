<template>
	<v-content>
		<!-- Primary tabs level -->
		<v-tabs
			:tabset="[
				{
					tabId: 'ads',
					title: `<i class='fa fa-list'></i> ${ $t('profile.ads') } (${ offersList.length })`
				},
				{
					tabId: 'barters',
					title: `<i class='fa fa-sync-alt'></i> ${ $t('profile.barters') } (0)`
				},
				{
					tabId: 'favorites',
					title: `<i class='fa fa-heart'></i> ${ $t('profile.favorites') }`,
					active: activeTab === '#favorites'
				},
				{
					tabId: 'feedbacks',
					title: `<i class='fa fa-comments'></i> ${ $t('profile.feedbacks') }`,
					active: activeTab === '#feedbacks'
				}
			]"
			vType="pills"
		>
			<!-- Tab: Ads -->
			<template #ads>
				<!-- Secondary tabs level -->
				<v-tabs
					class="inner-tabs"
					:tabset="[
						{
							tabId: 'active',
							title: $t('profile.active')
						},
						{
							tabId: 'inactive',
							title: $t('profile.inactive')
						}
					]"
				>
					<!-- After tabset -->
					<template #after>
						<v-select
							:dropdown="views.map(view => ({
								text: `
									<i class='fa icon ${ 
										(() => {
											switch (view.value) {
												case 'tile': return 'fa-th-large';
												case 'row': return 'fa-align-justify';
											}
										})()
									}'></i>
									${ $t(`viewLabels.${ view.value }`) }
								`,
								value: view.value
							}))"
							@selected="selectView"
						/>
					</template>

					<!-- Tab: Active -->
					<template #active>
						<BarterList
							:items="offersList"
							:vType="bartersView"
						>
							<!-- 3-dots dropdown -->
							<template #favorite>
								<v-button
									vType="transparent"
									vSize="xs"
								>
									<i class="fa fa-ellipsis-v"></i>
									<template #dropdown>
										<div>
											123
										</div>
									</template>
								</v-button>
							</template>

							<!-- Date range, views and favorites -->
							<template #info="{ item }">
								<!-- <v-switch
									class="no-padding"
									type="checkbox"
									:label="$t('item.autorenew')"
								/> -->

								<ul>
									<li v-if="item?.time">
										<dl>
											<dt><i class="fa fa-calendar"></i></dt>
											<dd>
												<time>
													{{ $d(item.time * 1000, 'short') }} -
													{{ $d(item.until ? item.until * 1000 : (item.time + 2629746) * 1000, 'short') }}
												</time>
											</dd>
										</dl>
									</li>
								</ul>

								<dl>
									<!-- <dt><i class="fa fa-eye"></i></dt>
									<dd>33</dd> -->
									<dt><i class="fa fa-heart"></i></dt>
									<dd>99</dd>
								</dl>
							</template>

							<!-- Edit and find exchange -->
							<template #offer="{ item }" v-if="isMyProfile">
								<v-button :to="{ path: `/barter/edit/${ item.hash }`, params: { id: item.hash } }">{{ $t('item.edit') }}</v-button>
								<v-button vType="hit-stroke">{{ $t('item.find_exchange') }}</v-button>
							</template>
						</BarterList>
					</template>

					<!-- Tab: Inactive -->
					<template #inactive>
						<BarterList
							:items="barters.generate(8)"
							:vType="bartersView"
						/>
					</template>
				</v-tabs>
			</template>

			<!-- Tab: Barters -->
			<template #barters v-if="isMyProfile">
				Barters
			</template>

			<!-- Tab: Favorites -->
			<template #favorites v-if="isMyProfile">
				Favorites
			</template>

			<!-- Tab: Feedbacks -->
			<template #feedbacks>
				Feedbacks
			</template>
		</v-tabs>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>