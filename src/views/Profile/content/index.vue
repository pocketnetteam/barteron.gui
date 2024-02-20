<template>
	<v-content>
		<!-- Primary tabs level -->
		<v-tabs
			:tabset="[
				{
					tabId: 'ads',
					title: `<i class='fa fa-list'></i> ${ $t('profileLabels.ads') } (${ offersList.length })`,
					active: activeTab === '#ads'
				},
				{
					tabId: 'barters',
					title: `<i class='fa fa-sync-alt'></i> ${ $t('profileLabels.barters') } (0)`,
					active: activeTab === '#barters'
				},
				{
					tabId: 'favorites',
					title: `<i class='fa fa-heart'></i> ${ $t('profileLabels.favorites') } (${ favoriteList.length })`,
					visible: isMyProfile,
					active: activeTab === '#favorites'
				},
				{
					tabId: 'feedbacks',
					title: `<i class='fa fa-comments'></i> ${ $t('profileLabels.feedbacks') }`,
					active: activeTab === '#feedbacks'
				}
			]"
			vType="pills"
			:hashTabs="true"
			@change="updatePath"
		>
			<!-- Tab: Ads -->
			<template #ads>
				<!-- Secondary tabs level -->
				<v-tabs
					class="inner-tabs"
					:tabset="[
						{
							tabId: 'active',
							title: `${ $t('profileLabels.active') } (${ offersActive.length })`
						},
						{
							tabId: 'inactive',
							title: `${ $t('profileLabels.inactive') } (${ offersInactive.length })`
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
							class="tabcontent-holder"
							:items="offersActive"
							:vType="bartersView"
							:loaderState="fetching"
							:loaderItems="6"
						>
							<!-- Date range, views and favorites -->
							<template #info="{ item }" v-if="isMyProfile">
								<ul>
									<li v-if="item?.time">
										<dl :class="item.status">
											<dt><i class="fa fa-calendar"></i></dt>
											<dd>
												<time>
													{{ $d(item.time, 'short', $i18n.locale) }} -
													{{ $d(item.till, 'short', $i18n.locale) }}
												</time>
											</dd>
										</dl>
									</li>
								</ul>

								<!-- <dl>
									<dt><i class="fa fa-eye"></i></dt>
									<dd>33</dd>
									<dt><i class="fa fa-heart"></i></dt>
									<dd>99</dd>
								</dl> -->
							</template>

							<!-- Edit and find exchange -->
							<template #offer="{ item }" v-if="isMyProfile">
								<v-button
									:to="{ name: 'createBarter', params: { id: item.hash } }"
								>{{ $t('buttonLabels.edit') }}</v-button>
								<v-button
									vType="hit-stroke"
									:to="{ name: 'exchangeOptions', params: { id: item.hash }, query: { expanded: 1 } }"
								>{{ $t('buttonLabels.find_exchange') }}</v-button>
							</template>
						</BarterList>
					</template>

					<!-- Tab: Inactive -->
					<template #inactive>
						<BarterList
							class="tabcontent-holder"
							:items="offersInactive"
							:vType="bartersView"
						>
							<!-- Date range, views and favorites -->
							<template #info="{ item }" v-if="isMyProfile">
								<ul>
									<li v-if="item?.time">
										<dl :class="item.status">
											<dt><i class="fa fa-calendar"></i></dt>
											<dd>
												<time>
													{{ $d(item.time, 'short', $i18n.locale) }} -
													{{ $d(item.till, 'short', $i18n.locale) }}
												</time>
											</dd>
										</dl>
									</li>
								</ul>

								<!-- <dl>
									<dt><i class="fa fa-eye"></i></dt>
									<dd>33</dd>
									<dt><i class="fa fa-heart"></i></dt>
									<dd>99</dd>
								</dl> -->
							</template>

							<!-- Edit and find exchange -->
							<template #offer="{ item }" v-if="isMyProfile">
								<v-button
									:to="{ name: 'createBarter', params: { id: item.hash } }"
								>{{ $t('buttonLabels.edit') }}</v-button>
								<v-button
									vType="hit-stroke"
									@click="renewOffer(item)"
								>{{ $t('buttonLabels.renew') }}</v-button>
							</template>
						</BarterList>
					</template>
				</v-tabs>
			</template>

			<!-- Tab: Barters -->
			<template #barters v-if="isMyProfile">
				<div class="tabcontent-holder">
					Barters
				</div>
			</template>

			<!-- Tab: Favorites -->
			<template #favorites v-if="isMyProfile">
				<BarterList
					class="tabcontent-holder"
					:items="favoriteList"
					:vType="bartersView"
					:loaderState="fetching"
					:loaderItems="6"
				></BarterList>
			</template>

			<!-- Tab: Feedbacks -->
			<template #feedbacks>
				<Votes class="tabcontent-holder" />
			</template>
		</v-tabs>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>