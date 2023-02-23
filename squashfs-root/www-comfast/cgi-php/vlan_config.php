<?php
$method = !empty($_GET["method"]) ? $_GET["method"] : "";
$iswan = !empty($_GET["iswan"]) ? $_GET["iswan"] : false;
$action = !empty($_GET["action"]) ? $_GET["action"] : "";

function str_clean($str)
{
	$remove_character = array("\n", "\r\n", "\r");
	$str = str_replace($remove_character , '', trim($str));
	return $str;
}

function apply_change() {
    shell_exec('echo vlan > /tmp/network_change');
    shell_exec('/lib/webcfg/apply.sh');
    shell_exec("(sleep 5; /etc/init.d/network reload) > /dev/null &");
}

function get_ifname($interface) {
    $iface_num = intval(substr($interface, 3)) - 1;

    $cmd = sprintf('uci get network.%s.ifname', $iface_num == 0 ? 'wan' : 'wan'.$iface_num); 
    $ifname = shell_exec($cmd);
    $ifname = str_clean($ifname);
    return $ifname;
}

function add_firewall_zone($network) {
    for($i = 0; $i < 3; $i++)
    {
        $cmd = sprintf("uci get firewall.@zone[%d].name 2>/dev/null", $i);
        $zone_name = shell_exec($cmd);
        $zone_name = str_clean($zone_name);
        if($zone_name == "wan"){
            // set uci
            $cmd = sprintf("uci del_list firewall.@zone[%d].network=%s 2>/dev/null", $i, $network);
            shell_exec($cmd);
            $cmd = sprintf("uci add_list firewall.@zone[%d].network=%s 2>/dev/null", $i, $network);
            shell_exec($cmd);

            shell_exec("uci commit firewall");
            return;
        }
    }
}

function delete_firewall_zone($network) {
    for($i = 0; $i < 3; $i++)
    {
        $cmd = sprintf("uci get firewall.@zone[%d].name 2>/dev/null", $i);
        $zone_name = shell_exec($cmd);
        $zone_name = str_clean($zone_name);
        if($zone_name == "wan"){
            // set uci
            $cmd = sprintf("uci del_list firewall.@zone[%d].network=%s 2>/dev/null", $i, $network);
            shell_exec($cmd);

            shell_exec("uci commit firewall");
            return;
        }
    }

}

function delete_vlan($num){
    $cmd = sprintf("uci delete vlan.fw_vlan%s_fw.dest 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.fw_vlan%s_fw.src 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.fw_vlan%s_fw 2>/dev/null", $num); shell_exec($cmd);

    $cmd = sprintf("uci delete vlan.fw_vlan%s.network 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.fw_vlan%s.forward 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.fw_vlan%s.output 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.fw_vlan%s.input 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.fw_vlan%s.name 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.fw_vlan%s 2>/dev/null", $num); shell_exec($cmd);

    $cmd = sprintf("uci delete vlan.com_vlan%s.interface 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.com_vlan%s.port 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.com_vlan%s.desc 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.com_vlan%s.id 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.com_vlan%s 2>/dev/null", $num); shell_exec($cmd);

    $cmd = sprintf("uci delete vlan.vlan%s.ip6assign 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.vlan%s.proto 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.vlan%s.type 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.vlan%s.ipaddr 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.vlan%s.netmask 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.vlan%s.gateway 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.vlan%s.ifname 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.vlan%s.dns 2>/dev/null", $num); shell_exec($cmd);
    $cmd = sprintf("uci delete vlan.vlan%s 2>/dev/null", $num); shell_exec($cmd);
}
function add_vlan($real_nums, $real_num,$ifname,$port,$desc, $ipaddr, $netmask, $gateway, $dns, $proto ) {
    $cmd = sprintf("uci set vlan.vlan%s=interface", $real_num); shell_exec($cmd);
	
    //$proto = $ipaddr== "" ? "dhcp" : "static";
    $cmd = sprintf("uci set vlan.vlan%s.type='bridge'", $real_num); shell_exec($cmd);
    $cmd = sprintf("uci set vlan.vlan%s.ip6assign='60'", $real_num); shell_exec($cmd);
    $cmd = sprintf("uci set vlan.vlan%s.ifname='%s.%s'", $real_num, $ifname, $real_num); shell_exec($cmd);
    $cmd = sprintf("uci set vlan.vlan%s.proto='%s'", $real_num, $proto); shell_exec($cmd);
    if($dns  != ""){
        $cmd = sprintf("uci set vlan.vlan%s.dns='%s'", $real_num, $dns); shell_exec($cmd);
    }
    if($proto == "static"){
        $cmd = sprintf("uci set vlan.vlan%s.ipaddr='%s'", $real_num, $ipaddr); shell_exec($cmd);
        $cmd = sprintf("uci set vlan.vlan%s.netmask='%s'", $real_num, $netmask); shell_exec($cmd);
        $cmd = sprintf("uci set vlan.vlan%s.gateway='%s'", $real_num, $gateway); shell_exec($cmd);
    }

    if($proto == "dhcp"){
        if($netmask != ""){
            $cmd = sprintf("uci set vlan.vlan%s.netmask='%s'", $real_num, $netmask); shell_exec($cmd);
        }
        if($gateway != ""){
            $cmd = sprintf("uci set vlan.vlan%s.gateway='%s'", $real_num, $gateway); shell_exec($cmd);

        }
    }
    
    $cmd = sprintf("uci set vlan.com_vlan%s=com", $real_num); shell_exec($cmd);
    $cmd = sprintf("uci set vlan.com_vlan%s.port='%s'", $real_num, $port); shell_exec($cmd);
    $cmd = sprintf("uci set vlan.com_vlan%s.desc='%s'", $real_num, $desc); shell_exec($cmd);
    $cmd = sprintf("uci set vlan.com_vlan%s.interface='vlan%s'", $real_num, $real_num); shell_exec($cmd);
    $cmd = sprintf("uci set vlan.com_vlan%s.id='%s'", $real_num, $real_num); shell_exec($cmd);

    $cmd = sprintf("uci set vlan.fw_vlan%s=zone", $real_num); shell_exec($cmd);
    $cmd = sprintf("uci set vlan.fw_vlan%s.name='vlan%s'", $real_num, $real_num); shell_exec($cmd);
    $cmd = sprintf("uci set vlan.fw_vlan%s.input='ACCEPT'", $real_num); shell_exec($cmd);
    $cmd = sprintf("uci set vlan.fw_vlan%s.output='ACCEPT'", $real_num); shell_exec($cmd);
    $cmd = sprintf("uci set vlan.fw_vlan%s.forward='ACCEPT'", $real_num); shell_exec($cmd);
    $cmd = sprintf("uci add_list vlan.fw_vlan%s.network='vlan%s'", $real_num, $real_num); shell_exec($cmd);

    $cmd = sprintf("uci set vlan.fw_vlan%s_fw=forwarding", $real_num); shell_exec($cmd);
    $cmd = sprintf("uci set vlan.fw_vlan%s_fw.src='vlan%s'", $real_num, $real_num); shell_exec($cmd);
    $cmd = sprintf("uci set vlan.fw_vlan%s_fw.dest='wan'", $real_num); shell_exec($cmd);

    $cmd = sprintf("uci set vlan.vlan_list.list='%d,%s,'", count($real_nums), implode(",", $real_nums));
    shell_exec($cmd);
}
function get_real_nums() {
	$retData = array();
	$total_num = 0;
	$real_nums = array();
	
	$str_real_nums = shell_exec("uci get vlan.vlan_list.list 2>/dev/null");
	$nums = explode(",", $str_real_nums);
	$index = 0;
	foreach($nums as $k=>$num){
		$num = str_clean($num);
		if($num == "") continue;
		
		if($index == 0) $total_num = intval($num);
		else $real_nums[] = intval($num);
		$index++;
	}
    arsort($real_nums);
	return $real_nums;
}

if($method == 'GET'){
    if($action == 'vlan_info'){
        $real_nums = get_real_nums();
        $data = array();

        foreach($real_nums as $key=>$real_num){
            
            $cmd = sprintf('uci get vlan.vlan%s.gateway 2>/dev/null', $real_num);
            $ret = shell_exec($cmd);
            $gateway = str_clean($ret);

            $cmd = sprintf('uci get vlan.com_vlan%s.port 2>/dev/null', $real_num);
            $ret = shell_exec($cmd);
            $port = str_clean($ret);

            $cmd = sprintf('uci get vlan.com_vlan%s.desc 2>/dev/null', $real_num);
            $ret = shell_exec($cmd);
            $desc = str_clean($ret);


            $cmd = sprintf('uci get vlan.vlan%s.ifname 2>/dev/null', $real_num);
            $ret = shell_exec($cmd);
            $ifname = str_clean($ret);

            $cmd = sprintf("uci get vlan.vlan%s.dns 2>/dev/null", $real_num);
            $ret = shell_exec($cmd);
            $dns = str_clean($ret);

            $cmd = sprintf("uci get vlan.vlan%s.proto 2>/dev/null", $real_num);
            $ret = shell_exec($cmd);
            $proto = str_clean($ret);

            $cmd = sprintf("uci get vlan.vlan%s.upload 2>/dev/null", $real_num);
            $ret = shell_exec($cmd);
            $upload = str_clean($ret);

            $cmd = sprintf("uci get vlan.vlan%s.download 2>/dev/null", $real_num);
            $ret = shell_exec($cmd);
            $download = str_clean($ret);


            $cmd = sprintf('ubus call network.interface.vlan%s status 2>/dev/null', $real_num);
            $ret = shell_exec($cmd);
            $ret = str_clean($ret);
            $up = '';
            $ip = '';
            if($ret != ''){
                $network_info = json_decode($ret, true);
                $up = isset($network_info['up']) ? $network_info['up'] : '';

                $ipv4addrs = isset($network_info['ipv4-address']) ? $network_info['ipv4-address'] : [];
                if(count($ipv4addrs) > 0){
                    $ip = $ipv4addrs[0]['address'];
                }

            }


            $data[] = array('real_num'=>$real_num, 'gateway'=>$gateway, 'up'=>$up, 'ip'=>$ip, 'port'=>$port, 'iface'=>'vlan'.$real_num, 'ifname'=>$ifname, 'desc'=>$desc, 'dns'=>$dns, 'proto'=>$proto,
                'upload'=>$upload,
                'download'=>$download,
            );
        }
        $response = array("errCode"=>0, 'data'=>$data);
        echo json_encode($response);
    }

}
else if($method == 'SET') {
    $post_data = json_decode(file_get_contents('php://input', true), true);

    $post_data = isset($post_data['list']) ? $post_data['list'] : $post_data;

    $num = count($post_data);
    foreach($post_data as $key=>$data){
        if($data['action'] == 'speed'){
            $real_num = $data['real_num'];
            $download = $data['download'];
            $upload = $data['upload'];
            //set download speed
            $cmd = sprintf("uci set vlan.vlan%s.download=%s", $real_num, $download); shell_exec($cmd);
            //set upload speed
            $cmd = sprintf("uci set vlan.vlan%s.upload=%s", $real_num, $upload); shell_exec($cmd);

            shell_exec("uci commit vlan");
            // no need apply change
            //apply_change();
        }
        if($data['action'] == 'edit'){
            $real_num = $data['real_num'];
            $id = $data['id'];
            $desc = $data['desc'];
            $port = $data['port'];

            $ipaddr = $data['ipaddr'];
            $netmask = $data['netmask'];
            $gateway = $data['gateway'];
            $dns = $data['dns'];
            $proto = $data['proto'];//$ipaddr == "" ? 'dhcp' : 'static';

            $ifname = get_ifname($port);
            $real_nums = get_real_nums();

            if($real_num != $id){
                delete_vlan($real_num);
                $deleted_nums = array();
    
                foreach($real_nums as $real_index=>$real_value)
                {
                    if($real_value == $real_num){
    
                    }else{
                        $deleted_nums[] = $real_value;
                    }
                }
                $deleted_nums[] = $id;

                add_vlan($deleted_nums, $id,$ifname,$port,$desc, $ipaddr, $netmask, $gateway, $dns, $proto );
            }
            else {
                $cmd = sprintf("uci set vlan.vlan%s.ifname='%s.%s'", $real_num, $ifname, $real_num); shell_exec($cmd);
                $cmd = sprintf("uci set vlan.vlan%s.proto='%s'", $real_num, $proto); shell_exec($cmd);
                if($proto == "dhcp"){
                    
                    
                    if($netmask != ""){
                        $cmd = sprintf("uci set vlan.vlan%s.netmask='%s'", $real_num, $netmask); shell_exec($cmd);
                    }else{
                        $cmd = sprintf("uci delete vlan.vlan%s.netmask 2>/dev/null", $real_num); shell_exec($cmd);
                    }
                    if($gateway != ""){
                        $cmd = sprintf("uci set vlan.vlan%s.gateway='%s'", $real_num, $gateway); shell_exec($cmd);
                    }else{
                        $cmd = sprintf("uci delete vlan.vlan%s.gateway 2>/dev/null", $real_num); shell_exec($cmd);
                    }

                    
                    $cmd = sprintf("uci delete vlan.vlan%s.ipaddr 2>/dev/null", $real_num); shell_exec($cmd);

                }
                else
                {
                    $cmd = sprintf("uci set vlan.vlan%s.netmask='%s'", $real_num, $netmask); shell_exec($cmd);
                    $cmd = sprintf("uci set vlan.vlan%s.ipaddr='%s'", $real_num, $ipaddr); shell_exec($cmd);
                    $cmd = sprintf("uci set vlan.vlan%s.gateway='%s'", $real_num, $gateway); shell_exec($cmd);
                }

                
                $cmd = sprintf("uci set vlan.com_vlan%s.port='%s'", $real_num, $port); shell_exec($cmd);
                $cmd = sprintf("uci set vlan.com_vlan%s.desc='%s'", $real_num, $desc); shell_exec($cmd);
                if($dns == ""){

                    $cmd = sprintf("uci delete vlan.vlan%s.dns 2>/dev/null", $real_num); shell_exec($cmd);
                }else{
                    $cmd = sprintf("uci set vlan.vlan%s.dns='%s'", $real_num, $dns); shell_exec($cmd);
                }

                $cmd = sprintf("uci set vlan.vlan_list.list='%d,%s,'", count($real_nums), implode(",", $real_nums));
			
                shell_exec($cmd);
            }

            shell_exec("uci commit vlan");
            apply_change();
        }
        else if($data['action'] == 'del'){

            $del_list = $data['list'];
			$del_nums = explode(",", $del_list);
			$real_nums = get_real_nums();

			foreach($del_nums as $k=>$num) {
				if($num == "") continue;
                delete_vlan($num);
			}
			
			//set num
			$deleted_nums = array();
			
			foreach($real_nums as $real_index=>$real_num)
			{
				if($real_num == "" ) continue;
				$bFound = false;
				foreach($del_nums as $del_index=>$del_num) {
					if($del_num == "") continue;
					if(intval($del_num) == intval($real_num)) {
						$bFound = true;
						break;
					}
				}
				
				if($bFound == false) 
					$deleted_nums[] = $real_num;
			}
			$cmd = sprintf("uci set vlan.vlan_list.list='%d,%s,'", count($deleted_nums), implode(",", $deleted_nums));
			shell_exec($cmd);
            shell_exec("uci commit vlan");

            if($iswan == true){
                foreach($del_nums as $k => $num){
                    if($num == "") continue;
                    $network_name = sprintf("vlan%s", $num);
                    delete_firewall_zone($network_name);
                }
            }

            apply_change();

		}
        else if($data['action'] == 'add'){
            $real_num = $data['id'];
            $desc = $data['desc'];
            $port = $data['port'];

            $ipaddr = $data['ipaddr'];
            $netmask = $data['netmask'];
            $gateway = $data['gateway'];
            $dns = $data['dns'];
            $proto = $data['proto']; //$ipaddr == "" ? 'dhcp' : 'static';


            $ifname = get_ifname($port);

            $real_nums = get_real_nums();
    		$real_nums[] = $real_num;
            arsort($real_nums);
            add_vlan($real_nums, $real_num,$ifname,$port,$desc, $ipaddr, $netmask, $gateway, $dns, $proto );

            if($iswan == true){
                $network_name = sprintf("vlan%s", $real_num);
                add_firewall_zone($network_name);
            }

            shell_exec("uci commit vlan");
            apply_change();
        }
    }
    header("Content-Type: application/json");
    echo json_encode(array("errCode"=>0));
}

?>