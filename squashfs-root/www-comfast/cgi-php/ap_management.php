<?php
function str_clean($str)
{
   $remove_character = array("\n", "\r\n", "\r");
   $str = str_replace($remove_character , '', trim($str));
    return $str;
}

function connectDB()
{
	$tbl_device_conf = "/etc/config/device_info";
	$tbl_ap_conf = "/etc/config/ap_info";
	
	if(!file_exists($tbl_device_conf)) {
		$cmd = sprintf("touch %s", $tbl_device_conf);
		shell_exec($cmd);
	}
	
	if(!file_exists($tbl_ap_conf)) {
		$cmd = sprintf("touch %s", $tbl_ap_conf);
		shell_exec($cmd);
	}
	
	/*
	
    $dbname = "/www-comfast/data/device.db";
    $db = new SQLite3($dbname);

    $cmdText = "CREATE TABLE IF NOT EXISTS tbl_device (
        Id integer NOT NULL,
        AP_MAC nvarchar(50) COLLATE NOCASE,
        DEVICE_MAC nvarchar(50),
        DEVICE_IP nvarchar(50),
        DEVICE_OS nvarchar(50),
        DEVICE_HOSTNAME nvarchar(50),
        auth integer,
        authorized integer,
        freq integer,
        iface nvarchar(50),
        network nvarchar(50),
        encryption nvarchar(50),
        ssid nvarchar(50),
        channel nvarchar(50),
        hwmode nvarchar(50),
        radio nvarchar(50),
        RSSI nvarchar(50),
        MAX_SIGNAL nvarchar(50),
        SNR nvarchar(50),
        rx_speed nvarchar(50),
        tx_speed nvarchar(50),
        UpdateTime datetime,
        PRIMARY KEY(Id AUTOINCREMENT)
    ) ";

    $db->query($cmdText);

    $cmdText = "CREATE TABLE IF NOT EXISTS tbl_ap (
        Id integer NOT NULL,
        lan_macaddr nvarchar(50) COLLATE NOCASE,
        wan_macaddr nvarchar(50),
        lan_duplex nvarchar(100),
        wan_duplex nvarchar(100),
        lan_status nvarchar(50),
        wan_status nvarchar(50),
        lan_speed nvarchar(50),
        wan_speed nvarchar(50),
        UpdateTime datetime,
        PRIMARY KEY(Id AUTOINCREMENT)
    )";

    $db->query($cmdText);

    return $db;
    */
}

function getApCount($wan_macaddr) {
	$tbl_ap_conf = "ap_info";
	$cmd = "";
	
	if($wam_macaddr == "") {
		$cmd = sprintf("uci show %s | grep .wan_macaddr", $tbl_ap_conf);
	}
	else
	{
		$cmd = sprintf("uci show %s | grep .wan_macaddr='%s'", $tbl_ap_conf, $wan_macaddr);
	}

	$str_aps = shell_exec($cmd);
	$aps = explode("\n", $str_aps);
	$total_cnt = 0;
	foreach($aps as $k=>$v){
		$v = str_clean($v);
		if($v == "") continue;	
		$total_cnt++;
	}	
	return $total_cnt;
}

function getAPIndex($wan_macaddr) {
	$tbl_ap_conf = "ap_info";
	$cmd = sprintf("uci show %s | grep .wan_macaddr='%s' | cut -d [ -f 2 | cut -d ] -f 1", $tbl_ap_conf, $wan_macaddr);
	$str_id = shell_exec($cmd);
	$ids = explode("\n", $str_id);
	foreach($ids as $k=>$v) {
		$v = str_clean($v);
		if($v == "") continue;
		
		return parseInt($v);
		
		break;
	}
	
	return -1;
}

function getDeviceIndex($DEVICE_MAC) {

	$tbl_device_conf = "device_info";
	$cmd = sprintf("uci show %s | grep .DEVICE_MAC='%s' | cut -d [ -f 2 | cut -d ] -f 1", $tbl_device_conf, $DEVICE_MAC);
	$str_id = shell_exec($cmd);
	$ids = explode("\n", $str_id);
	foreach($ids as $k=>$v) {
		$v = str_clean($v);
		if($v == "") continue;
		
		return parseInt($v);
		
		break;
	}
	
	return -1;
}

function updateAPInfo($link_info) {
	
	$id = getAPIndex($link_info->wan_macaddr);
	if($id != -1) {
		$cmd = sprintf("uci set ap_info.@ap[%d].lan_macaddr='%s'", $id, $link_info->lan_macaddr); shell_exec($cmd);
		$cmd = sprintf("uci set ap_info.@ap[%d].lan_speed='%s'", $id, $link_info->lan_speed); shell_exec($cmd);
		$cmd = sprintf("uci set ap_info.@ap[%d].wan_speed='%s'", $id, $link_info->wan_speed); shell_exec($cmd);
		$cmd = sprintf("uci set ap_info.@ap[%d].lan_duplex='%s'", $id, $link_info->lan_duplex); shell_exec($cmd);
		$cmd = sprintf("uci set ap_info.@ap[%d].wan_duplex='%s'", $id, $link_info->wan_duplex); shell_exec($cmd);
		$cmd = sprintf("uci set ap_info.@ap[%d].lan_status='%s'", $id, $link_info->lan_status); shell_exec($cmd);
		$cmd = sprintf("uci set ap_info.@ap[%d].wan_status='%s'", $id, $link_info->wan_status); shell_exec($cmd);
		$cmd = sprintf("uci set ap_info.@ap[%d].UpdateTime='%s'", $id, time()); shell_exec($cmd);
		shell_exec("uci commit ap_info");
		
		echo "updateAPLink()->update";
	}
}

function insertAPInfo($link_info) {
	$cmd = sprintf("uci add ap_info ap"); shell_exec($cmd);
	$cmd = sprintf("uci set ap_info.@ap[-1].lan_macaddr='%s'", $id, $link_info->lan_macaddr); shell_exec($cmd);
	$cmd = sprintf("uci set ap_info.@ap[-1].wan_macaddr='%s'", $id, $link_info->wan_macaddr); shell_exec($cmd);
	$cmd = sprintf("uci set ap_info.@ap[-1].lan_speed='%s'", $id, $link_info->lan_speed); shell_exec($cmd);
	$cmd = sprintf("uci set ap_info.@ap[-1].wan_speed='%s'", $id, $link_info->wan_speed); shell_exec($cmd);
	$cmd = sprintf("uci set ap_info.@ap[-1].lan_duplex='%s'", $id, $link_info->lan_duplex); shell_exec($cmd);
	$cmd = sprintf("uci set ap_info.@ap[-1].wan_duplex='%s'", $id, $link_info->wan_duplex); shell_exec($cmd);
	$cmd = sprintf("uci set ap_info.@ap[-1].lan_status='%s'", $id, $link_info->lan_status); shell_exec($cmd);
	$cmd = sprintf("uci set ap_info.@ap[-1].wan_status='%s'", $id, $link_info->wan_status); shell_exec($cmd);
	$cmd = sprintf("uci set ap_info.@ap[-1].UpdateTime='%s'", $id, time()); shell_exec($cmd);
	shell_exec("uci commit ap_info");

    echo "updateAPLink()->insert";

}


function updateDeviceInfo($device_info) {
	
	$id = getDeviceIndex($device_info["DEVICE_MAC"] );
	
	//$device_info["AP_MAC"] = ""; 
	
	//$device_info["DEVICE_MAC"] = empty($client->mac) ? "" : $client->mac;
	$cmd = sprintf("uci set device_info.@device[%s].DEVICE_IP='%s'", $id, $device_info["DEVICE_IP"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].DEVICE_OS='%s'", $id, $device_info["DEVICE_OS"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].DEVICE_HOSTNAME='%s'", $id, $device_info["DEVICE_HOSTNAME"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].auth='%s'", $id, $device_info["auth"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].authorized='%s'", $id, $device_info["authorized"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].freq='%s'", $id, $device_info["freq"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].iface='%s'", $id, $device_info["iface"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].network='%s'", $id, $device_info["network"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].encryption='%s'", $id, $device_info["encryption"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].ssid='%s'", $id, $device_info["ssid"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].channel='%s'", $id, $device_info["channel"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].hwmode='%s'", $id, $device_info["hwmode"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].radio='%s'", $id, $device_info["radio"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].RSSI='%s'", $id, $device_info["RSSI"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].MAX_SIGNAL='%s'", $id, $device_info["MAX_SIGNAL"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].SNR='%s'", $id, $device_info["SNR"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].rx_speed='%s'", $id, $device_info["rx_speed"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[%s].tx_speed='%s'", $id, $device_info["tx_speed"]); shell_exec($cmd);
	
	shell_exec("uci commit device_info");
}



function insertDeviceInfo($device_info) {
	
	$cmd = sprintf("uci add device_info device"); shell_exec($cmd);

	$cmd = sprintf("uci set device_info.@device[-1].DEVICE_MAC='%s'", $id, $device_info["DEVICE_MAC"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].DEVICE_IP='%s'", $id, $device_info["DEVICE_IP"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].DEVICE_OS='%s'", $id, $device_info["DEVICE_OS"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].DEVICE_HOSTNAME='%s'", $id, $device_info["DEVICE_HOSTNAME"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].auth='%s'", $id, $device_info["auth"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].authorized='%s'", $id, $device_info["authorized"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].freq='%s'", $id, $device_info["freq"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].iface='%s'", $id, $device_info["iface"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].network='%s'", $id, $device_info["network"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].encryption='%s'", $id, $device_info["encryption"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].ssid='%s'", $id, $device_info["ssid"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].channel='%s'", $id, $device_info["channel"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].hwmode='%s'", $id, $device_info["hwmode"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].radio='%s'", $id, $device_info["radio"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].RSSI='%s'", $id, $device_info["RSSI"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].MAX_SIGNAL='%s'", $id, $device_info["MAX_SIGNAL"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].SNR='%s'", $id, $device_info["SNR"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].rx_speed='%s'", $id, $device_info["rx_speed"]); shell_exec($cmd);
	$cmd = sprintf("uci set device_info.@device[-1].tx_speed='%s'", $id, $device_info["tx_speed"]); shell_exec($cmd);
	
	shell_exec("uci commit device_info");
}





function updateAPLink($link_info/*, $db*/)
{
    if($link_info->wan_macaddr == "") return;
    
    $ap_index = getAPIndex($link_info->wan_macaddr);
    
    if($ap_index != -1) {
		updateAPInfo($link_info);
	}
	else {
		insertAPInfo($link_info);
	}
    
    /*
    
    $cmdText = sprintf("SELECT *, COUNT(*) AS CNT FROM tbl_ap WHERE wan_macaddr='%s'", $link_info->wan_macaddr);
    $res = $db->query($cmdText);
    $arr = $res->fetchArray();

        
    if ($arr['CNT'] != 0 && $res->numColumns()) {
        //update
        $cmdText = "UPDATE tbl_ap SET 
        lan_macaddr='".$link_info->lan_macaddr."',  
        lan_speed='".$link_info->lan_speed."',
        wan_speed='" . $link_info->wan_speed . "',
        lan_duplex='" . $link_info->lan_duplex . "',
        wan_duplex='". $link_info->wan_duplex . "',
        lan_status='" . $link_info->lan_status . "',
        wan_status='" . $link_info->wan_status . "',
        UpdateTime=datetime('now') 
        WHERE wan_macaddr='".$link_info->wan_macaddr."'";
        $db->exec($cmdText);
        echo "updateAPLink()->update";
    }
    else
    {
        //insert
        $cmdText = "INSERT INTO tbl_ap (wan_macaddr, lan_macaddr,lan_speed,wan_speed,lan_speed,lan_duplex,wan_duplex,lan_status,wan_status) 
        VALUES ('".$link_info->wan_macaddr."',
            '".$link_info->lan_macaddr."',
            '".$link_info->lan_speed."',
            '".$link_info->wan_speed."',
            '".$link_info->lan_duplex."',
            '".$link_info->wan_duplex."',
            '".$link_info->lan_status."',
            '".$link_info->wan_status."',
             datetime('now'));";
        $db->exec($cmdText);
        echo "updateAPLink()->insert";

    }
    */
}

function getAPLink(/*$db*/)
{
	
	$str_ids = shell_exec("uci show ap_info | grep wan_macaddr | cut -d [ -f 2 | cut -d ] -f 1");
	$ids = explode("\n", $str_ids);
	$outData = array();
	foreach($ids as $k=>$v) {
			
		$v = str_clean($v);
		if($v == "") continue;
	
        $link = array();
        $cmd = sprintf("uci get ap_info.@ap[%s].lan_macaddr", $v); $lan_macaddr = shell_exec($cmd); $lan_macaddr = str_clean($lan_macaddr);
        $link['lan_macaddr'] = $lan_macaddr;

        $cmd = sprintf("uci get ap_info.@ap[%s].wan_macaddr", $v); $wan_macaddr = shell_exec($cmd); $wan_macaddr = str_clean($wan_macaddr);
        $link['wan_macaddr'] = $wan_macaddr;

        $cmd = sprintf("uci get ap_info.@ap[%s].lan_speed", $v); $lan_speed = shell_exec($cmd); $lan_speed = str_clean($lan_speed);
        $link['lan_speed'] = $lan_speed;
        
        $cmd = sprintf("uci get ap_info.@ap[%s].wan_speed", $v); $wan_speed = shell_exec($cmd); $wan_speed = str_clean($wan_speed);
        $link['wan_speed'] = $wan_speed;

        $cmd = sprintf("uci get ap_info.@ap[%s].lan_duplex", $v); $lan_duplex = shell_exec($cmd); $lan_duplex = str_clean($lan_duplex);
        $link['lan_duplex'] = $lan_duplex;
        
        $cmd = sprintf("uci get ap_info.@ap[%s].wan_duplex", $v); $wan_duplex = shell_exec($cmd); $wan_duplex = str_clean($wan_duplex);
        $link['wan_duplex'] = $wan_duplex;
        
        $cmd = sprintf("uci get ap_info.@ap[%s].lan_status", $v); $lan_status = shell_exec($cmd); $lan_status = str_clean($lan_status);
        $link['lan_status'] = $lan_status;
        
        $cmd = sprintf("uci get ap_info.@ap[%s].wan_status", $v); $wan_status = shell_exec($cmd); $wan_status = str_clean($wan_status);
        $link['wan_status'] = $wan_status;
        
        $outData[] = $link;
	}
		
	/*
    $cmdText = "SELECT * FROM tbl_ap";
    $res = $db->query($cmdText);
    $outData = array();
    while($arr = $res->fetchArray())
    {
        $link = array();
        $link['lan_macaddr'] = $arr['lan_macaddr'];
        $link['wan_macaddr'] = $arr['wan_macaddr'];
        $link['lan_speed'] = $arr['lan_speed'];
        $link['wan_speed'] = $arr['wan_speed'];
        $link['lan_duplex'] = $arr['lan_duplex'];
        $link['wan_duplex'] = $arr['wan_duplex'];
        $link['lan_status'] = $arr['lan_status'];
        $link['wan_status'] = $arr['wan_status'];
        $outData[] = $link;
    }
    */

    return $outData;
}


function updateDevice($obj/*, $db*/)
{

    
    foreach($obj as $k=>$client)
    {
		$device_info = array();
        $device_info["AP_MAC"] = ""; 
        $device_info["DEVICE_MAC"] = empty($client->mac) ? "" : $client->mac;
        $device_info["DEVICE_IP"]  = empty($client->ip) ? "" : $client->ip;
        $device_info["DEVICE_OS"]  = empty($client->os) ? "" : $client->os;
        $device_info["DEVICE_HOSTNAME"] = empty($client->hostname) ? "" : $client->hostname;
        $device_info["auth"] = empty($client->auth) ? 0 : $client->auth;
        $device_info["authorized"]  = empty($client->authorized) ? 0 : $client->authorized;
        $device_info["freq"]  = empty($client->freq) ? 0 : $client->freq;
        $device_info["iface"]  = empty($client->iface) ? "" : $client->iface;
        $device_info["network"]  = empty($client->radio_info->network) ? "" : implode(",", $client->radio_info->network);
        $device_info["encryption"]  = empty($client->radio_info->encryption) ? "" : $client->radio_info->encryption;
        $device_info["ssid"]  = empty($client->radio_info->ssid) ? "" : $client->radio_info->ssid;
        $device_info["channel"]  = empty($client->radio_info->channel) ? "" : $client->radio_info->channel;
        $device_info["hwmode"]  = empty($client->radio_info->hwmode) ? "" : $client->radio_info->hwmode;
        $device_info["radio"] = empty($client->radio_info->radio) ? "" : $client->radio_info->radio;
        $device_info["RSSI"]  = empty($client->RSSI) ? "" : $client->RSSI;
        $device_info["MAX_SIGNAL"] = empty($client->MAX_SIGNAL) ? "": $client->MAX_SIGNAL;
        $device_info["SNR"] = empty($client->SNR) ? "" : $client->SNR;
        $device_info["rx_speed"] = empty($client->rx_speed) ? "" : $client->rx_speed;
        $device_info["tx_speed"] = empty($client->tx_speed) ? "" : $client->tx_speed;
        
        $device_id = getDeviceIndex($k);
        if($device_id != -1) {
			updateDeviceInfo($device_info);
		}
		else 
		{
			insertDeviceInfo($device_info);
		}

        //$query = sprintf("SELECT *, COUNT(*) AS CNT FROM tbl_device WHERE DEVICE_MAC='%s'", $k);

        //$res = $db->query($query);

        //var_dump($res);
        //$arr = $res->fetchArray();
/*
        
        if ($arr['CNT'] != 0 && $res->numColumns()) {
            // have rows
            //update current row

            $device_id = $arr['Id'];
            $query = "UPDATE tbl_device SET 
                AP_MAC='".$AP_MAC."',
                DEVICE_MAC='" .$DEVICE_MAC . "',
                DEVICE_IP='".$DEVICE_IP."',
                DEVICE_OS='".$DEVICE_OS."',
                DEVICE_HOSTNAME='".$DEVICE_HOSTNAME."',
                auth='".$auth."',
                authorized='".$authorized."',
                freq='".$freq."',
                iface='".$iface."',
                network='".$network."',
                encryption='".$encryption."',
                ssid='".$ssid."',
                channel='".$channel."',
                hwmode='".$hwmode."',
                radio='".$radio."',
                RSSI='".$RSSI."',
                MAX_SIGNAL='".$MAX_SIGNAL."',
                SNR='".$SNR."',
                rx_speed='".$rx_speed."',
                tx_speed='".$tx_speed."',
                UpdateTime=datetime('now')
             WHERE Id='" . $device_id . "';";
             $db->exec($query);

        } else {
            // zero rows
            $query = "INSERT INTO tbl_device (AP_MAC, DEVICE_MAC, DEVICE_IP, DEVICE_OS, DEVICE_HOSTNAME, auth, authorized, freq, iface, network, encryption,ssid,channel,hwmode,radio,RSSI,MAX_SIGNAL,SNR,rx_speed,tx_speed,UpdateTime) 
            VALUES ('". $AP_MAC ."',
            '" .$DEVICE_MAC. "', 
            '".$DEVICE_IP."',
            '".$DEVICE_OS."',
            '".$DEVICE_HOSTNAME."',
            '".$auth."',
            '".$authorized."',
            '".$freq."',
            '".$iface."',
            '".$network."',
            '".$encryption."',
            '".$ssid."',
            '".$channel."',
            '".$hwmode."',
            '".$radio."',
            '".$RSSI."',
            '".$MAX_SIGNAL."',
            '".$SNR."',
            '".$rx_speed."',
            '".$tx_speed."',
            datetime('now') )";

            $db->exec($query);
        }
        * */

    }

}

function deleteDevice($mac)
{
	$str_ids = shell_exec("uci show device_info | grep DEVICE_MAC | cut -d [ -f 2 | cut -d ] -f 1");
	$ids = explode("\n", $str_ids);
	foreach($ids as $k=>$v) {
			
		$v = str_clean($v);
		if($v == "") continue;
		
		
		$cmd = sprintf("uci set device_info.@device[%s].DEVICE_MAC", $v); $device_mac = shell_exec($cmd); 
    	$cmd = sprintf("uci set device_info.@device[%s].AP_MAC", $v); $device_mac = shell_exec($cmd); 
    	$cmd = sprintf("uci set device_info.@device[%s].DEVICE_IP", $v); $DEVICE_IP = shell_exec($cmd);
    	$cmd = sprintf("uci set device_info.@device[%s].DEVICE_OS", $v); $DEVICE_OS = shell_exec($cmd);
    	$cmd = sprintf("uci set device_info.@device[%s].DEVICE_HOSTNAME", $v); $DEVICE_HOSTNAME = shell_exec($cmd);
    	$cmd = sprintf("uci set device_info.@device[%s].auth", $v); $auth = shell_exec($cmd);
    	$cmd = sprintf("uci set device_info.@device[%s].authorized", $v); $authorized = shell_exec($cmd);
    	$cmd = sprintf("uci set device_info.@device[%s].freq", $v); $freq = shell_exec($cmd);
    	$cmd = sprintf("uci set device_info.@device[%s].iface", $v); $iface = shell_exec($cmd);
    	$cmd = sprintf("uci set device_info.@device[%s].network", $v); $network = shell_exec($cmd);
    	$cmd = sprintf("uci set device_info.@device[%s].encryption", $v); $encryption = shell_exec($cmd);
    	$cmd = sprintf("uci set device_info.@device[%s].ssid", $v); $ssid = shell_exec($cmd);
    	$cmd = sprintf("uci set device_info.@device[%s].channel", $v); $channel = shell_exec($cmd);
    	$cmd = sprintf("uci set device_info.@device[%s].hwmode", $v); $hwmode = shell_exec($cmd);
    	$cmd = sprintf("uci set device_info.@device[%s].radio", $v); $radio = shell_exec($cmd);
    	$cmd = sprintf("uci set device_info.@device[%s].RSSI", $v); $RSSI = shell_exec($cmd);
        $cmd = sprintf("uci set device_info.@device[%s].MAX_SIGNAL", $v); $MAX_SIGNAL = shell_exec($cmd);
        $cmd = sprintf("uci set device_info.@device[%s].SNR", $v); $SNR = shell_exec($cmd);
        $cmd = sprintf("uci set device_info.@device[%s].rx_speed", $v); $rx_speed = shell_exec($cmd);
        $cmd = sprintf("uci set device_info.@device[%s].tx_speed", $v); $tx_speed = shell_exec($cmd); 
        $cmd = sprintf("uci set device_info.@device[%s]", $v); $tx_speed = shell_exec($cmd); 
        
        
        shell_exec("uci commit device_info");
	}
	
	
	
    //$query = sprintf("DELETE FROM tbl_device WHERE DEVICE_MAC='%s'", $mac);
    //$db->query($query);
}


function getDeviceData(/*$db*/)
{
	
	$str_ids = shell_exec("uci show device_info | grep DEVICE_MAC | cut -d [ -f 2 | cut -d ] -f 1");
	$ids = explode("\n", $str_ids);
	$cur_time = time();
	$from_time = $cur_time - 3600; // - hour before
	$retData = array();
	foreach($ids as $k=>$v) {
			
		$v = str_clean($v);
		if($v == "") continue;
		
		$cmd = sprintf("uci get device_info.@device[%s].UpdateTime", $v);
		$strTime = shell_exec($cmd);
		$strTime = str_clean($strTime);
		if($strTime == "") continue;
		
		$time_num = parseInt($strTime);
		if($time_num < $from_time) continue;
		
		$cmd = sprintf("uci get device_info.@device[%s].DEVICE_MAC", $v); $device_mac = shell_exec($cmd); $device_mac = str_clean($device_mac); 
		//$device_mac =  $row["DEVICE_MAC"];
        if($device_mac == "") continue;
		
		$device_info = array();
    	
    	$cmd = sprintf("uci get device_info.@device[%s].AP_MAC", $v); $device_mac = shell_exec($cmd); $AP_MAC = str_clean($AP_MAC); 
        $device_info['AP_MAC'] = $AP_MAC;
        
        $device_info['DEVICE_MAC'] = $device_mac;

    	$cmd = sprintf("uci get device_info.@device[%s].DEVICE_IP", $v); $DEVICE_IP = shell_exec($cmd); $DEVICE_IP = str_clean($DEVICE_IP); 
        $device_info['DEVICE_IP']= $DEVICE_IP;

    	$cmd = sprintf("uci get device_info.@device[%s].DEVICE_OS", $v); $DEVICE_OS = shell_exec($cmd); $DEVICE_OS = str_clean($DEVICE_OS); 
        $device_info['DEVICE_OS']= $DEVICE_OS;

    	$cmd = sprintf("uci get device_info.@device[%s].DEVICE_HOSTNAME", $v); $DEVICE_HOSTNAME = shell_exec($cmd); $DEVICE_HOSTNAME = str_clean($DEVICE_HOSTNAME); 
        $device_info['DEVICE_HOSTNAME']= $DEVICE_HOSTNAME;

    	$cmd = sprintf("uci get device_info.@device[%s].auth", $v); $auth = shell_exec($cmd); $auth = str_clean($auth); 
        $device_info['auth']= $auth;

    	$cmd = sprintf("uci get device_info.@device[%s].authorized", $v); $authorized = shell_exec($cmd); $authorized = str_clean($authorized); 
        $device_info['authorized']= $authorized;

    	$cmd = sprintf("uci get device_info.@device[%s].freq", $v); $freq = shell_exec($cmd); $freq = str_clean($freq); 
        $device_info['freq']= $freq;

    	$cmd = sprintf("uci get device_info.@device[%s].iface", $v); $iface = shell_exec($cmd); $iface = str_clean($iface); 
        $device_info['iface']= $iface;

    	$cmd = sprintf("uci get device_info.@device[%s].network", $v); $network = shell_exec($cmd); $network = str_clean($network); 
        $device_info['network']= $network;
        
    	$cmd = sprintf("uci get device_info.@device[%s].encryption", $v); $encryption = shell_exec($cmd); $encryption = str_clean($encryption); 
        $device_info['encryption']= $encryption;

    	$cmd = sprintf("uci get device_info.@device[%s].ssid", $v); $ssid = shell_exec($cmd); $ssid = str_clean($ssid); 
        $device_info['ssid']= $ssid;

    	$cmd = sprintf("uci get device_info.@device[%s].channel", $v); $channel = shell_exec($cmd); $channel = str_clean($channel); 
        $device_info['channel']= $channel;

    	$cmd = sprintf("uci get device_info.@device[%s].hwmode", $v); $hwmode = shell_exec($cmd); $hwmode = str_clean($hwmode); 
        $device_info['hwmode']= $hwmode;
        
    	$cmd = sprintf("uci get device_info.@device[%s].radio", $v); $radio = shell_exec($cmd); $radio = str_clean($radio); 
        $device_info['radio']= $radio;

    	$cmd = sprintf("uci get device_info.@device[%s].RSSI", $v); $RSSI = shell_exec($cmd); $RSSI = str_clean($RSSI); 
        $device_info['RSSI']= $RSSI;
        
        $cmd = sprintf("uci get device_info.@device[%s].MAX_SIGNAL", $v); $MAX_SIGNAL = shell_exec($cmd); $MAX_SIGNAL = str_clean($MAX_SIGNAL); 
        $device_info['MAX_SIGNAL']= $MAX_SIGNAL;

        $cmd = sprintf("uci get device_info.@device[%s].SNR", $v); $SNR = shell_exec($cmd); $SNR = str_clean($SNR); 
        $device_info['SNR'] = $SNR;
        
        $cmd = sprintf("uci get device_info.@device[%s].rx_speed", $v); $rx_speed = shell_exec($cmd); $rx_speed = str_clean($rx_speed); 
        $device_info['rx_speed'] = $rx_speed;
        
        $cmd = sprintf("uci get device_info.@device[%s].tx_speed", $v); $tx_speed = shell_exec($cmd); $tx_speed = str_clean($tx_speed); 
        $device_info['tx_speed'] = $tx_speed;

        $retData[] = $device_info;
	}
	
	
	/*
    //retrieve 1 hour data
    $query = "SELECT * FROM tbl_device WHERE UpdateTime > datetime('now', '-1 hour')";
    $result = $db->query($query);
    $retData = array();
    while ($row = $result->fetchArray()) 
    {
        $device_info = array();
        $device_mac = $row["DEVICE_MAC"];
        if($device_mac == "") continue;
        $device_info['AP_MAC'] = $row['AP_MAC'];
        $device_info['DEVICE_MAC'] = $row['DEVICE_MAC'];
        $device_info['DEVICE_IP']= $row['DEVICE_IP'];
        $device_info['DEVICE_OS']= $row['DEVICE_OS'];
        $device_info['DEVICE_HOSTNAME']= $row['DEVICE_HOSTNAME'];
        $device_info['auth']= $row['auth'];
        $device_info['authorized']= $row['authorized'];
        $device_info['freq']= $row['freq'];
        $device_info['iface']= $row['iface'];
        $device_info['network']= $row['network'];
        $device_info['encryption']= $row['encryption'];
        $device_info['ssid']= $row['ssid'];
        $device_info['channel']= $row['channel'];
        $device_info['hwmode']= $row['hwmode'];
        $device_info['radio']= $row['radio'];
        $device_info['RSSI']= $row['RSSI'];
        $device_info['MAX_SIGNAL']= $row['MAX_SIGNAL'];
        $device_info['SNR'] = $row['SNR'];
        $device_info['rx_speed'] = $row['rx_speed'];
        $device_info['tx_speed'] = $row['tx_speed'];

        $retData[] = $device_info;
    }
    **/

    return $retData;
}

$method = !empty($_GET["method"]) ? $_GET["method"] : "";
$action = !empty($_GET["action"]) ? $_GET["action"] : "";

if($method == "GET")
{
    if($action == "ap_link")
    {
        $db = connectDB();
        $links = getAPLink(/*$db*/);
        $errCode = 0;

        header("Content-type: application/json");
        $data = array("errCode"=>$errCode, "ap_link"=>$links);
        echo json_encode($data);
    }
    else
    {
        $db = connectDB();
        $devices = getDeviceData(/*$db*/);
        $errCode = 0;
    
        header("Content-type: application/json");
        $data = array("errCode"=>$errCode, "devices"=>$devices);
        echo json_encode($data);
    
    }
}
else if($method == "SET")
{
    if($action == "delete")
    {
        $mac = !empty($_GET["mac"]) ? $_GET["mac"] : "";
        if($mac != "")
        {
            //$db = connectDB();
            deleteDevice($mac/*, $db*/);
        }

    }
    else if($action == "ap_link")
    {
        $post_data = json_decode(file_get_contents('php://input', true));
        $AP_MAC = $post_data->AP_MAC;
        $LINK_INFO = $post_data->LINK_INFO;
        updateAPLink(/*$AP_MAC, */$LINK_INFO/*, $db*/);

        /*
        $post_data = json_decode(file_get_contents('php://input', true));
        $AP_MAC = $post_data->AP_MAC;
        $LINK_INFO = $post_data->LINK_INFO;
        $db = connectDB();

        updateAPLink($AP_MAC, $LINK_INFO, $db);
        */

    }
    else if($action == "period")
    {
        $json_text = file_get_contents('php://input', true);
        $req_data = json_decode($json_text);
    
        $clients = $req_data->clients;
        $link_info = $req_data->link_info;
    
        //$db = connectDB();
        updateDevice($clients/*, $db*/);

        updateAPLink($link_info/*, $db*/);
   
   
   }

}




?>
