<template>
	<header id="header">
		<div class="top">
			<div class="inner">
				<LanguageSwitcher />
				<!-- <MainMenu /> -->
			</div>
		</div>
		<div class="bottom">
			<div class="bar">
				<div class="inner">
						<h1 class="logo">
						<router-link to="/">Barteron</router-link>
					</h1>

					<Location />
					<SearchBar />
					<UserBar />
				</div>
			</div>
		</div>
	</header>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>