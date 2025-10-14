<?php
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

require_once('rpc.php');
require_once('api.php');

class OG {
	private $rpc = NULL;
	private $api = NULL;

	private $domain = NULL;
	private $project = NULL;

	private $defaultOg = NULL;

	public $currentOg = array();
	public $manifest = array();

	public function __construct($get, $proxypath, $domain = NULL, $project = NULL) {
		$this->rpc = new RPC($proxypath);
		$this->api = new API($proxypath);

		$this->manifest = json_decode(file_get_contents('b_manifest.json'), true);
		$this->project = $project ?? $this->manifest['name'];
		$this->domain = $domain ?? $this->manifest['id'];

		$this->defaultOg = array(
			'title' => $this->project,
			'site_name' => $this->project, 
			'type' => 'website',
			'image' => "https://{$this->manifest['scope']}/{$this->manifest['icon']}",
			'description' => $this->manifest['description'],
		);
	}

	public function __destruct() {

	}

	public function check() {
		/* if (!$this->is_bot()) return; */

		$uri = trim($_SERVER['REQUEST_URI'], '/');

		if (isset($uri)) {
			@list($page, $id) = explode('/', $uri);

			if ($id && (substr($id, 0, strlen('search')) == 'search' || substr($id, 0, strlen('safedeal')) == 'safedeal')) {
				@list($page, $id) = explode('?', $id);
				parse_str($id, $id);
			}

			switch(@$page) {
				case 'barter': {
					$title = false;
					$description = false;
					$images = false;
					$result = $this->rpc->brtoffersbyhashes(array($this->clean($id)));

					if ($result != false){
						$offer = $result[0];

						$title = urldecode($offer->p->s2);
						$description = urldecode($offer->p->s3);
						$images = json_decode($offer->p->s5);

						if($title) $this->currentOg['title'] = $title;
						if($description) $this->currentOg['description'] = $description;
						if($images) $this->currentOg['image'] = urldecode($images[0]);
					}

					break;
				}

				case 'search': {
					$title = false;
					$description = false;
					$images = false;
					$offers = $this->rpc->brtoffersbyhashes(array_filter([
						@$id['source'] ? $id['source'] : null,
						@$id['target'] ? $id['target'] : null
					]));

					if ($offers != false){
						$source = @$offers[0];
						$target = @$offers[1];

						if (@$source) {
							$srcTitle = urldecode($source->p->s2);
							$srcImage = json_decode($source->p->s5);
						}

						if (@$target) {
							$trgTitle = urldecode($target->p->s2);
						}

						if (@$srcTitle && @$trgTitle) {
							$this->currentOg['title'] = "Exchange {$srcTitle} to {$trgTitle}";
							$this->currentOg['description'] = "I proposing exchange {$srcTitle} to {$trgTitle}";
						} else if (@$srcTitle) {
							$this->currentOg['title'] = "Exchange proposals of {$srcTitle}";
							$this->currentOg['description'] = "Exchange list of {$srcTitle}";
						}

						if (@$srcImage) $this->currentOg['image'] = urldecode($srcImage[0]);
					}

					break;
				}

				case 'safedeal': {
					$title = false;
					$description = false;
					$image = false;
					
					$lang = $this->getBrowserLang();

					$offerTitle = '';
					$sellerAddress = false;
					$result = $this->rpc->brtoffersbyhashes(array_filter([
						@$id['offer'] ? $id['offer'] : null
					]));
					if ($result != false){
						$offer = $result[0];
						$offerTitle = urldecode($offer->p->s2);
						$sellerAddress = ($offer->s1) ? urldecode($offer->s1) : false;
					}

					$buyerName = $this->getSafeDealUserName($id, 'buyer');
					$validatorName = $this->getSafeDealUserName($id, 'validator');

					$sellerName = '';
					if ($sellerAddress != false) {
						$result = $this->rpc->getuserprofile($this->clean($sellerAddress));
						if ($result != false){
							$profile = $result[0];
							$sellerName = urldecode($profile->name);
						}
					}

					$validatorFeePercent = @$id['fee'] ? $id['fee'] : '?';

					switch ($lang) {
						case 'en':
							$title = 'Safe deal';
							$description = "Guarantor: {$validatorName}, fee: {$validatorFeePercent}%; Seller: {$sellerName}; Buyer: {$buyerName}; Subject of the deal: {$offerTitle}";
							break;

						case 'ru':
							$title = 'Безопасная сделка';
							$description = "Гарант: {$validatorName}, процент: {$validatorFeePercent}%; Продавец: {$sellerName}; Покупатель: {$buyerName}; Предмет сделки: {$offerTitle}";
							break;

						default:
							break;
					}
				}

				case 'profile': {
					$title = false;
					$description = false;
					$image = false;
					$result = $this->rpc->getuserprofile($this->clean($id));

					if ($result != false){
						$profile = $result[0];

						$title = urldecode($profile->name);
						$description = urldecode("$title's profile on {$this->project}");
						$image = urldecode($profile->i);
						
						if($title) $this->currentOg['title'] = $title;
						if($description) $this->currentOg['description'] = $description;
						if($image) $this->currentOg['image'] = $image;
					}
				}
			}
		}
	}

	public function is_bot() {

		if (isset($_SERVER['HTTP_USER_AGENT'])){
			if(preg_match('/mozila|gekko|safari|chrome|khtml|webkit|bastyon/i', $_SERVER['HTTP_USER_AGENT'])){
				if(preg_match('/vkshare|whatsapp|viber|instagram|bastyon/i', $_SERVER['HTTP_USER_AGENT'])){
					return true;
				}

				return false;
			}

			return true;
		}
		
		return true;

	}

	public function clean($value) {
		$value = trim($value);
		$value = stripslashes($value);
		$value = strip_tags($value);
		$value = htmlspecialchars($value);
		
		return $value;
	}

	public function echotags() {
		$tags = array_merge($this->defaultOg, $this->currentOg);

		echo join(
			"\n\t",
			array_map(function($key, $value) {
				$prefix = 'og:';
	
				if(strpos($key, 'twitter') !== false) $prefix = '';
	
				return "<meta property=\"$prefix$key\" content=\"$value\">";
			}, array_keys($tags), array_values($tags))
		) . "\n";
	}

	public function getIconLink() {
		echo "<link rel=\"icon\" href=\"https://{$this->manifest['scope']}/{$this->manifest['icon']}\">";
	}

	public function getBrowserLang(array $available = ['en', 'ru'], $default = 'en') {
		if (empty($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
			return $default;
		}

		$header = $_SERVER['HTTP_ACCEPT_LANGUAGE'];

		// Search all langs + q-factors
		preg_match_all(
			'/([a-z]{1,8}(?:-[a-z]{1,8})?)(?:;q=([0-9\.]+))?/i',
			$header,
			$matches,
			PREG_SET_ORDER
		);

		$prefs = [];
		foreach ($matches as $m) {
			$lang = strtolower($m[1]);
			$q    = isset($m[2]) ? (float)$m[2] : 1.0;
			$prefs[$lang] = $q;
		}

		// Sort by q descending
		arsort($prefs, SORT_NUMERIC);

		// Looking for matches
		foreach ($prefs as $lang => $q) {
			// Full match
			if (in_array($lang, $available)) {
				return $lang;
			}
			// Compare by the first 2 letters (for example, en = en-US)
			$short = substr($lang, 0, 2);
			foreach ($available as $avail) {
				if ($short === substr($avail, 0, 2)) {
					return $avail;
				}
			}
		}

		return $default;
	}

	public function getSafeDealUserName($id, $key) {
		$result = '';
		$address = @$id[$key] ? $id[$key] : false;
		if ($address != false) {
			$rpcResult = $this->rpc->getuserprofile($this->clean($address));
			if ($rpcResult != false) {
				$user = $rpcResult[0];
				$result = urldecode($user->name);
			}
		}
		return $result;
	}
}
