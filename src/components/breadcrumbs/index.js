export default {
	name: "Breadcrumbs",

	data() {
		return {
			matches: (() => {
				let matches = this.$route.matched;

				matches = matches.map(match => {
					switch(match.name) {
						case "category": {
							match = Object.assign(
								Object.assign({}, this.$route),
								{ name: this.$route.params.slug }
							);
							break;
						}
					}

					return match;
				});

				if (matches.length < 2) {
					matches = [this.$router.options.routes[0]].concat(matches);
				}

				return matches;
			})()
		}
	}
}