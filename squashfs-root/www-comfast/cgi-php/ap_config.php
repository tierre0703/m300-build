<?php
$config_path = "/etc/config/ap_custom";
$method = !empty($_GET["method"]) ? $_GET["method"] : "";
$action = !empty($_GET["action"]) ? $_GET["action"] : "";


function str_clean($str)
{
   $remove_character = array("\n", "\r\n", "\r");
   $str = str_replace($remove_character , '', trim($str));
    return $str;
}


if(!file_exists($config_path))
{
    shell_exec('touch ' . $config_path);
}

if($method=="GET")
{
    if($action == "desc")
    {

        $retOutput = array();

        $cmd = "uci show ap_custom | grep mac | cut -d [ -f 2 | cut -d ] -f 1";
        $retVal = shell_exec($cmd);
        $idx_arr = explode("\n", $retVal);

        foreach($idx_arr as $k=>$idx)
        {
            $idx = str_clean($idx);

            if($idx == "")
                continue;

            //get desc, mac
            $cmd = sprintf("uci get ap_custom.@ap[%s].desc", $idx);
            $desc = shell_exec($cmd);
            $desc = str_clean($desc);

            $cmd = sprintf("uci get ap_custom.@ap[%s].mac", $idx);
            $mac = shell_exec($cmd);
            $mac = str_clean($mac);
            $retOutput[] = array('mac'=>$mac, 'desc'=>$desc);
        }

        // output
        header("Content-type: application/json");
        echo json_encode($retOutput);
    }

}
else if($method == "SET")
{
    if($action == "desc")
    {
        $json_text = file_get_contents('php://input', true);
        $data  = json_decode($json_text);
        $mac = $data->mac;
        $desc = $data->desc;

        $cmd = sprintf("uci show ap_custom | grep %s | cut -d [ -f 2 | cut -d ] -f 1", $mac);
        $idx = shell_exec($cmd);
        $idx = str_clean($idx);
        if($idx == "")
        {
            $cmd = sprintf("uci add ap_custom ap");
            shell_exec($cmd);
            $cmd = sprintf("uci set ap_custom.@ap[-1].mac=%s", $mac);
            shell_exec($cmd);
            $cmd = sprintf("uci set ap_custom.@ap[-1].desc='%s'", $desc);
            shell_exec($cmd);
        }
        else
        {
            $cmd = sprintf("uci set ap_custom.@ap[%s].desc='%s'", $desc);
            shell_exec($cmd);
        }

        shell_exec("uci commit ap_custom");

        $retOutput = array("errCode"=>0);
        // output
        header("Content-type: application/json");
        echo json_encode($retOutput);
    }

}

?>
