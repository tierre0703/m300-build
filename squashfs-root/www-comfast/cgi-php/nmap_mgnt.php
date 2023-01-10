<?php


function get_vlan_info()
{
    $vlan_txt = shell_exec("ubus list | grep network.interface.vlan | cut -d . -f 3");
    $vlan_list = explode("\n", $vlan_txt);
    $ret_info = array();

    foreach($vlan_list as $k=>$vlan)
    {
        $vlan = str_clean($vlan);
        if($vlan == "") continue;
        $cmd = sprintf("ubus call network.interface.%s status", $vlan);
        $vlan_info = shell_exec($cmd);
        $vlan_json = json_decode($vlan_info);
        $metric = 0;
        $vlan_ip = "";
        $vlan_mask = "";

        if(!empty($vlan_json->metric))
            $metric = $vlan_json->metric;

        if(!empty($vlan_json['ipv4-address']))
        {
            $vlan_ip = $vlan_json['ipv4-address'][0]['address'];
            $vlan_mask = $vlan_json['ipv4-address'][0]['mask'];
        }


        $ret_info[$vlan] =  array('metric'=>$metric, 'cidr'=>ipv4Breakout($vlan_ip, $vlan_mask));
    }

    return $ret_info;
}



function ipv4Breakout ($ip_address, $ip_nmask) {
    $hosts = array();
    //convert ip addresses to long form
    $ip_address_long = ip2long($ip_address);
    $ip_nmask_long = ip2long($ip_nmask);

    //caculate network address
    $ip_net = $ip_address_long & $ip_nmask_long;
    $cidr = mask2cidr($ip_nmask);
    $cidr_addr = long2ip($ip_net) . "/" . $cidr;


    $block_info = array("network" => "$ip_net",
            "cidr" => "$cidr_addr" //,
        );

    return $block_info;
}

function mask2cidr($mask){
    $long = ip2long($mask);
    $base = ip2long('255.255.255.255');
    return 32-log(($long ^ $base)+1,2);
}

function str_clean($str)
{
   $remove_character = array("\n", "\r\n", "\r");
   $str = str_replace($remove_character , '', trim($str));
    return $str;
}

function parse_iwinfo_assoclist($interface, &$clients)
{
    $cmd = sprintf("iwinfo %s assoclist", $interface);
    $ret = shell_exec($cmd);
   
    $arr = explode("\n", $ret);

    $RSSI = "";
    $MAX_SIGNAL = "";
    $SNR = "";
    $mac = "";

    foreach($arr as $k=>$v)
    {



        if((strstr($v, "No station connected") != false) ||
        ((strstr($v, "(SNR") == false)  && (($k % 4) == 0)))
        {
            
            break;
        }
       


        switch($k % 4)
        {
            case 0:
                {
                    $tokens = preg_split('/\s+/', $v);
                    //$tokens[0] mac
                    //$token[1] RSSI
                    // dBm
                    // /
                    // $token[4] max speed
                    // (SNR)
                    //$token[6] SNR

                    $mac = str_clean($tokens[0]);
                    $RSSI = str_clean($tokens[1]);
                    $MAX_SIGNAL= str_clean($tokens[4]);
                    $SNR = str_clean($tokens[7]);
                    $SNR = str_replace(")", "",$SNR);
                  
                }
                break;
            case 1:
                {
                  

                    $tokens = explode(",", $v);
                    if(count($tokens) < 2) break;
                    $rx_speed = $tokens[0];
                    $rx_speed = str_replace("RX: ", "", $rx_speed);
                    $rx_speed_token = explode(" ", $rx_speed);
                    if(count($rx_speed_token) < 2) break;
                    $rx_speed = str_clean($rx_speed_token[0]);

                }
                break;
            case 2:
                {
                    $tokens = explode(",", $v);
                    if(count($tokens) < 2) break;
                    $tx_speed = $tokens[0];
                    $tx_speed = str_replace("TX: ", "", $tx_speed);
                    $tx_speed_token = explode(" ", $tx_speed);
                    if(count($tx_speed_token) < 2) break;
                    $tx_speed = str_clean($tx_speed_token[0]);

                }
                break;

                case 3:
                    {
                        foreach($clients as $idx => $client_info)
                        {
                            if(strtolower($idx) == strtolower($mac))
                            {
                                $clients[$idx]['RSSI'] = $RSSI;
                                $clients[$idx]['MAX_SIGNAL'] = $MAX_SIGNAL;
                                $clients[$idx]['SNR'] = $SNR;
                                $clients[$idx]['rx_speed'] = $rx_speed;
                                $clients[$idx]['tx_speed'] = $tx_speed;
                                
                            }
                        }
                        break;
                    }
            
        }

    }
    

   
}

$method = !empty($_GET["method"]) ? $_GET["method"] : "";
$action = !empty($_GET["action"]) ? $_GET["action"] : "";


if($method=="GET")
{
    if($action == "nmap")
    {
        //retrieve nmap info for clients if vlan
        
    $cmd = "ubus list | grep hostapd | cut -d . -f 2";
    $ret = shell_exec($cmd);
    
    $interfaces = explode("\n", $ret);
    
    $total_clients = array();
    
    
    
    foreach($interfaces as $key => $interface)
    {
    
        $interface = str_clean($interface);
        if($interface == "") continue;
    
        //###########################################
    
        $cmd = sprintf("ubus call hostapd.%s get_clients", $interface);
        $ret = shell_exec($cmd);
        $ret = str_clean($ret);
        if($ret == "") continue;
    
        $ret_json = json_decode($ret);
    
        $clients = parse_ubus_client($ret_json);
    
        foreach($clients as $k=>$v)
        {
            $total_clients[$k] = $v;
            $total_clients[$k]['iface'] = $interface;
            $total_clients[$k]['radio_info'] = !empty($radio_info[$interface]) ? $radio_info[$interface] : array();
        }
    
        //#########################################
        parse_iwinfo_assoclist($interface, $total_clients);
    
    
        //##############################################
        get_arp_table($total_clients);
    }

}

else if($method=="SET")
{

}

?>