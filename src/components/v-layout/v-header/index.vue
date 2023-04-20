<template>
	<header id="header">
		<div class="top">
			<LanguageSwitcher />
			<MainMenu />
		</div>
		<div class="bottom">
			<div class="bar">
				<h1 class="logo">
					<router-link to="/">Barteron</router-link>
				</h1>

				<Location />
				<SearchBar />
				<UserBar />
			</div>
		</div>
	</header>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>