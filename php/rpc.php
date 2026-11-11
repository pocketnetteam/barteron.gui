<?php

/**
 * Node RPC through the Pocketnet proxy, for link previews (og.php).
 *
 * Ported from the old app (barteron.gui/public/rpc.php): same endpoint
 * (`<proxy>/rpc/<method>`) and payload. What changed:
 * - timeouts: index.php waits for these calls before it sends the page, so a
 *   node that does not answer must not keep the app from opening;
 * - after the first failure the remaining calls of the request are skipped;
 * - an error from the node is "nothing found", not data.
 *
 * Works on PHP 7.0 and newer.
 */
class RPC
{
    private $node;
    private $failed = false;

    public function __construct($node)
    {
        $this->node = rtrim($node, '/') . '/';
    }

    /** `data` of the answer, or null. */
    public function send($method, array $params)
    {
        if ($this->failed || !function_exists('curl_init')) {
            return null;
        }

        $payload = array('method' => $method);
        if (!empty($params)) {
            $payload['parameters'] = $params;
        }

        $ch = curl_init($this->node . 'rpc/' . $method);
        curl_setopt_array($ch, array(
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => array('Content-Type: application/json', 'x-no-compression: 1'),
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_CONNECTTIMEOUT => 2,
            CURLOPT_TIMEOUT => 3,
        ));
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!is_string($body) || $status >= 500 || $status === 0) {
            $this->failed = true;
            return null;
        }

        $json = json_decode($body);
        if (is_object($json) && !empty($json->result) && isset($json->data)) {
            return $json->data;
        }
        return null;
    }

    /** Offers by their ids (txid of the first version), in the order asked. */
    public function offers(array $hashes)
    {
        $hashes = array_values(array_unique(array_filter($hashes)));
        if (empty($hashes)) {
            return array();
        }

        $data = $this->send('getbarteronoffersbyroottxhashes', array($hashes));
        $found = array();
        foreach (is_array($data) ? $data : array() as $offer) {
            if (is_object($offer) && isset($offer->s2) && is_string($offer->s2)) {
                $found[$offer->s2] = $offer;
            }
        }

        $ordered = array();
        foreach ($hashes as $hash) {
            if (isset($found[$hash])) {
                $ordered[$hash] = $found[$hash];
            }
        }
        return $ordered;
    }

    public function offer($hash)
    {
        $offers = $this->offers(array($hash));
        return isset($offers[$hash]) ? $offers[$hash] : null;
    }

    public function profile($address)
    {
        if (!$address) {
            return null;
        }
        $data = $this->send('getuserprofile', array(array($address)));
        return is_array($data) && isset($data[0]) && is_object($data[0]) ? $data[0] : null;
    }
}
