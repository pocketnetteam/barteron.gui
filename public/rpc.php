<?PHP

class RPC {

	protected $node = 'https://pocketnet.app:8899/rpc/';

	public function __construct ($proxypath)
	{
		if (isset($proxypath)){
			$this->node = $proxypath;
		}
	}
	public function __destruct ()
	{

	}
	
	private function prepareRequest($procedure, array $params = array())
	{
		$payload = array(
			'method' => $procedure,
		);
	
		if (!empty($params)) {
			$payload['parameters'] = $params;
		}
	
		return $payload;
	}

	private function curl($url, $fields){


		$ch = curl_init();
 
		curl_setopt($ch,CURLOPT_URL, $url);
		curl_setopt($ch,CURLOPT_POST, count($fields));
		curl_setopt($ch, CURLOPT_HTTPHEADER, Array("Content-type: application/json", "x-no-compression: 1"));
		curl_setopt($ch,CURLOPT_POSTFIELDS, json_encode($fields));
		curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		
		$result = curl_exec($ch);

		/* $info = curl_error($ch);
		var_dump($info); */

		//echo curl_error($ch);
		curl_close($ch);

		

		if ($result != false){
			$json = JSON_decode($result);

			if (isset($json->result) && $json->result != null){
				$result = $json->data;
			} else if (isset($json->error)) {
				$result = $json->error;
			} else {
				$result = false;
			}
		}

		return $result;
	}

	public function send($action, $params){
		$fields = $this->prepareRequest($action, $params);
		
		$url = $this->node."rpc/".$action;

		return $this->curl($url, $fields);
	}
	
	public function brtoffersbyhashes($hashes){
		$action = 'getbarteronoffersbyroottxhashes';
		$params = array($hashes);
		$offers = $this->send($action, $params);

		if ($offers) {
			usort($offers, function($a, $b) use ($hashes) {
				return array_search($a->s2, $hashes) - array_search($b->s2, $hashes);
			});
		}

		return $offers;
	}

	public function getuserprofile($address){
		$action = 'getuserprofile';
		$params = array(array($address));

		return $this->send($action, $params);
	}
}