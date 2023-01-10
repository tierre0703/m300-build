<?php

/**
 * 
 */

function str_clean($str)
{
   $remove_character = array("\n", "\r\n", "\r");
   $str = str_replace($remove_character , '', trim($str));
    return $str;
}

function parse_ubus_client($_json)
{
    $clients = array();
    $json_clients = $_json->clients;

    foreach($json_clients as $key=>$client_info)
    {
        $client = array();
        $client['mac'] = $key;
        $client['auth'] = $client_info->auth;
        $client['authorized'] = $client_info->authorized;
        $client['freq'] = $_json->freq;
        $clients[$key] = $client;
    }
    return $clients;
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

function get_wireless_info()
{
    $ret = shell_exec("ubus call network.wireless status");
    $wireless_info = json_decode($ret);
    

    $client_wireless_info = array();

    foreach($wireless_info as $radio=>$radio_info)
    {
        $hwmode = "";
        $channel = "";
        $ifname = "";
        $ssid = "";
        $encryption = "";
        $macaddr = "";
        $network = array();

        if(empty($radio_info->interfaces)) continue;




        if(!empty($radio_info->config->hwmode))
            $hwmode = $radio_info->config->hwmode;

        if(!empty($radio_info->config->channel))
            $channel = $radio_info->config->channel;


        foreach($radio_info->interfaces as $interface_id =>$interface)
        {
            $c_interface = array();

            if(!empty($interface->ifname))
                $ifname = $interface->config->ifname;
            
            if(!empty($interface->config->ssid))
                $ssid = $interface->config->ssid;
            
            if(!empty($interface->config->encryption))
                $encryption = $interface->config->encryption;
            
            if(!empty($interface->config->network))
                $network = $interface->config->network;
            
            if(!empty($interface->config->macaddr))
                $macaddr = $interface->config->macaddr;


            $c_interface['network'] = $network;
            $c_interface['encryption'] = $encryption;
            $c_interface['ssid'] = $ssid;
            $c_interface['ifname'] = $ifname;
            $c_interface['channel'] = $channel;
            $c_interface['hwmode'] = $hwmode;
            $c_interface['radio'] = $radio;
            $c_interface['macaddr'] = $macaddr;

            
            $client_wireless_info[$ifname] = $c_interface;
 
        }
    }
    return $client_wireless_info;
}

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
        if(!empty($vlan_json->metric))
            $metric = $vlan_json->metric;

        $ret_info[$vlan] = $metric;
    }

    return $ret_info;
}




function get_arp_table(&$clients)
{
    $cmd = sprintf('arp -a | grep -e "0x2"');
    $arp_data = shell_exec("arp -a");
    //echo urlencode($arp_data);
    $arp_array = explode("\n", $arp_data);
    $mac_array = array();
    foreach($arp_array as $arp_idx => $arp_val)
    {
        $arp_tokens = preg_split('/\s+/', $arp_val);
        if(count($arp_tokens) < 5) continue;
        $mac_addr = $arp_tokens[3];
        $mac_addr =  str_clean($mac_addr);
        if(preg_match('/^([a-fA-F0-9]{2}:){5}[a-fA-F0-9]{2}$/', $mac_addr) != 1) continue;
        $arp_ip = $arp_tokens[1];
        $arp_ip = str_replace("(", "", $arp_ip);
        $arp_ip = str_replace(")", "", $arp_ip);

        $arp_ip = str_clean($arp_ip);
        $mac_array[$arp_ip] = $mac_addr; 



        foreach($clients as $k=>$v)
        {
            if(strtolower($k) == strtolower($mac_addr))
            {
                $clients[$k]["ip"] = $arp_ip;
                break;
            }
        }
    }

    return $mac_array;
}

function getAPLink()
{
    $lan_macaddr = shell_exec("uci get network.def_lan_macaddr");
    $lan_macaddr = str_clean($lan_macaddr);
    
    $lan_ifname = shell_exec("uci get network.lan.ifname");
    $lan_ifname = str_clean($lan_ifname);

    $wan_macaddr = shell_exec("uci get network.def_wan_macaddr");
    $wan_macaddr = str_clean($wan_macaddr);

    $wan_ifname = shell_exec("uci get network.wan.ifname");
    $wan_ifname = str_clean($wan_ifname);

    $lan_speed = "";
    $wan_speed = "";

    $lan_duplex = "";
    $wan_duplex = "";

    $lan_status = "";
    $wan_status = "";



    $ret = shell_exec("swconfig dev switch0 show | grep link:");

    $link_tokens = explode("\n", $ret);

    $links = array();

    foreach($link_tokens as $k=>$v)
    {
        $v = str_clean($v);
        if($v == "") continue;
        //link: port:0 link:up speed:1000baseT full-duplex
        //link: port:1 link:down

        $port = "";
        $status = "";
        $speed = "";
        $optional = "";
        $duplex = "";
        $txflow = "";
        $rxflow = "";
        $auto = "";
        if(strstr($v, "speed:") != false)
        {
            sscanf($v, "link: port:%d link:%s speed:%d %[^[]]", $port, $status, $speed, $optional);
        }
        else
        {
            sscanf($v, "link: port:%d link:%s", $port, $status);
        }

        if($optional != "")
        {
            $opts = explode(" ", $optional);
            foreach($opts as $opt)
            {
                if(strstr($opt, "duplex") != false)
                {
                    $duplex = str_clean($opt);
                }
                if(strstr($opt, "auto") != false)
                {
                    $auto = str_clean($opt);
                }

                if(strstr($opt, "txflow") != false)
                {
                    $txflow = str_clean($opt);
                }
                if(strstr($opt, "rxflow") != false)
                {
                    $rxflow = str_clean($opt);
                }

            }
        }

        $port_name = "eth0." .($port+1);
        if($port_name == $lan_ifname)
        {
            $lan_speed = $speed;
            $lan_duplex = $duplex;
            $lan_status = $status;
        }
        else if($port_name == $wan_ifname)
        {
            $wan_speed = $speed;
            $wan_duplex = $duplex;
            $wan_status = $status;
        }
    }

    $retData = array(
        "lan_macaddr"=>$lan_macaddr,
        "wan_macaddr"=>$wan_macaddr,
        "lan_ifname"=>$lan_ifname,
        "wan_ifname"=>$wan_ifname,
        "lan_speed"=>$lan_speed,
        "wan_speed"=>$wan_speed,
        "lan_duplex"=>$lan_duplex,
        "wan_duplex"=>$wan_duplex,
        "lan_status"=>$lan_status,
        "wan_status"=>$wan_status
    );

    return $retData;

}

//
$interface = !empty($_GET["interface"]) ? $_GET["interface"] : "";
$mac = !empty($_GET["mac"]) ? $_GET["mac"] : "";
$status = !empty($_GET["status"]) ? $_GET["status"] : "";



if($interface == "" &&
$mac == "" &&
$status == "")
{

    $cmd = "ubus list | grep hostapd | cut -d . -f 2";
    $ret = shell_exec($cmd);
    
    $interfaces = explode("\n", $ret);
    
    $total_clients = array();
    
    $radio_info = get_wireless_info();
    $vlan_info = get_vlan_info();
    
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
    
    $ac_ip = shell_exec("cat /tmp/lan_ac");
    $ac_ip = str_clean($ac_ip);
    if($ac_ip == "")
        exit(0);
    var_dump($total_clients);
    
    $link_info = getAPLink();
    $outputData = array("clients"=>$total_clients, "vlans"=>$vlan_info, "link_info"=>$link_info);
    var_dump($link_info);
    
    $cmd = sprintf("curl  \"http://%s/cgi-php/ap_management.php?method=SET&action=period\" --header \"Content-Type: application/json\" --request POST --data '%s'", $ac_ip, json_encode($outputData));
    $cmd_ret = shell_exec($cmd);
    echo "ret_curl " .$cmd . $cmd_ret;
}
else
{
    if($status == "connected")
    {
        //insert device
         $cmd = "ubus list | grep hostapd | cut -d . -f 2";
        $ret = shell_exec($cmd);
        
        $interfaces = explode("\n", $ret);
        
        $total_clients = array();
        
        $radio_info = get_wireless_info();
        $vlan_info = get_vlan_info();
        
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
        
        $ac_ip = shell_exec("cat /tmp/lan_ac");
        $ac_ip = str_clean($ac_ip);
        if($ac_ip == "")
            exit(0);
        var_dump($total_clients);
        
        $outputData = array("clients"=>$total_clients, "vlans"=>$vlan_info);
        
        
        $cmd = sprintf("curl  \"http://%s/cgi-php/ap_management.php?method=SET&action=period\" --header \"Content-Type: application/json\" --request POST --data '%s'", $ac_ip, json_encode($outputData));
        $cmd_ret = shell_exec($cmd);
        echo "ret_curl " . $cmd_ret;

    }
    else if ($status == "disconnected")
    {
        //delete
        if($mac == "") exit(0);
        $cmd = sprintf("curl  \"http://%s/cgi-php/ap_management.php?method=SET&action=delete&mac=%s\"", $ac_ip, $mac);
        $cmd_ret = shell_exec($cmd);
    }
}

?>