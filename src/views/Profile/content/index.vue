<template>
	<v-content>
		<!-- Primary tabs level -->
		<v-tabs
			:tabset="[
				{
					tabId: 'my-ads',
					title: `<i class='fa fa-list'></i> ${ $t('profile.my_ads') } (0)`
				},
				{
					tabId: 'my-barters',
					title: `<i class='fa fa-sync-alt'></i> ${ $t('profile.my_barters') } (0)`
				},
				{
					tabId: 'messages',
					title: `<i class='fa fa-comment'></i> ${ $t('profile.messages') } (0)`
				},
				{
					tabId: 'favorites',
					title: `<i class='fa fa-heart'></i> ${ $t('profile.favorites') }`
				},
				{
					tabId: 'feedbacks',
					title: `<i class='fa fa-comments'></i> ${ $t('profile.feedbacks') }`
				}
			]"
			vType="pills"
		>
			<!-- Tab: My ads -->
			<template #my-ads>
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
						<v-select @selected="selectView">
							<template>
								<span class="value"></span>
							</template>
			
							<template #dropdown>
								<option
									v-for="(view, index) in views"
									:key="index"
									:value="view.value"
								>
									<i
										:class="{
											'fa': true,
											'fa-th-large': view.value === 'tile',
											'fa-align-justify': view.value === 'row',
											'icon': true
										}"
									></i>
									{{ $t(`viewLabels.${ view.value }`) }}
								</option>
							</template>
						</v-select>
					</template>

					<!-- Tab: Active -->
					<template #active>
						<BarterList
							:items="myAds"
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
								<v-switch
									class="no-padding"
									type="checkbox"
									:label="$t('item.autorenew')"
								/>

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
									<dt><i class="fa fa-eye"></i></dt>
									<dd>33</dd>
									<dt><i class="fa fa-heart"></i></dt>
									<dd>99</dd>
								</dl>
							</template>

							<!-- Edit and find exchange -->
							<template #offer="{ item }">
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

			<!-- Tab: My barters -->
			<template #my-barters>
				My barters
			</template>

			<!-- Tab: Messages -->
			<template #messages>
				Messages
			</template>

			<!-- Tab: Favorites -->
			<template #favorites>
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