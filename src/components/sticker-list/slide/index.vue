<template>
	<div 
		class="sticker-list-slide"
		:style="{ 'background-color': item.backgroundColor }"
	>
		<div class="back-icon">
			<i 
				:class="`fa ${item.icon}`"
				:style="{ 'opacity': item.iconOpacity }"
			></i>
		</div>
		<div class="content-holder">
			<div class="title">{{ item.title }}</div>
			<div class="details">
				<template v-if="item.id === 'legalInfo'">
					<LegalInfo
						:i18nDocumentKeys="requiredLegalInfoItemKeys"
						colorType="dark"
					/>
				</template>
				<template v-else>
					<div class="description">{{ item.description }}</div>
					<div class="action">
						<a 
							class="link" 
							href="#" 
							@click.prevent="action"
						>
							{{ item.action.icon }}
							<span class="action-title">{{ item.action.title }}</span>
						</a>
					</div>
				</template>
			</div>

		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>