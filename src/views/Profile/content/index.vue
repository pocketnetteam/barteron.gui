<template>
	<v-content>
		<!-- Primary tabs level -->
		<v-tabs
			:tabset="[
				{
					tabId: 'ads',
					title: `<i class='fa fa-list'></i> ${ $t('profile.ads') } (${ offersList.length })`,
					active: activeTab === '#ads'
				},
				{
					tabId: 'barters',
					title: `<i class='fa fa-sync-alt'></i> ${ $t('profile.barters') } (0)`,
					active: activeTab === '#barters'
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
							class="tabcontent-holder"
							:items="offersList"
							:vType="bartersView"
						>
							<!-- 3-dots dropdown -->
							<template #favorite v-if="isMyProfile">
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
							<template #info="{ item }" v-if="isMyProfile">
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
													{{ $d(item.time, 'short') }} -
													{{ $d(item.till, 'short') }}
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
								<v-button
									:to="{ name: 'createBarter', params: { id: item.hash } }"
								>{{ $t('item.edit') }}</v-button>
								<v-button
									vType="hit-stroke"
									:to="{ name: 'exchangeOptions', params: { id: item.hash }, query: { expanded: 1 } }"
								>{{ $t('item.find_exchange') }}</v-button>
							</template>
						</BarterList>
					</template>

					<!-- Tab: Inactive -->
					<template #inactive>
						<BarterList
							class="tabcontent-holder"
							:items="barters.generate(8)"
							:vType="bartersView"
						/>
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
				<div class="tabcontent-holder">
					Favorites
				</div>
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