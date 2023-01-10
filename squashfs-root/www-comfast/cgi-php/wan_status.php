<?php

$method = !empty($_GET["method"]) ? $_GET["method"] : "";
$action = !empty($_GET["action"]) ? $_GET["action"] : "";


function str_clean($str)
{
   $remove_character = array("\n", "\r\n", "\r");
   $str = str_replace($remove_character , '', trim($str));
    return $str;
}

if($method == "GET")
{
    if($action == "wan_status")
    {
        $ret = shell_exec("ubus list | grep network.interface.wan | cut -d . -f 3");
        $wan_tokens = explode("\n", $ret);

        $outData = array();
        
        foreach($wan_tokens as $k=>$v)
        {
            $v = str_clean($v);
            if($v == "") continue;

            $wan_info = array();

            $cmd = sprintf("ifstatus %s", $v);
            $ret = shell_exec($cmd);
            $ret_json = json_decode($ret);
            $up = $ret_json->up;
            $device = $ret_json->device; //br-wan

            $wan_info["up"] = $up;
            $wan_info["device"] = $device;
            $wan_info["iface"] = $v;

            $outData[] = $wan_info;
        }


        header("Content-type: application/json");
        $data = array("errCode"=>0, "wan_status"=>$outData);
        echo json_encode($data);

    }
    else if($action == "wan_link")
    {
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

            $link_status = array(
                "port"=> ("eth0." .($port+1)),
                "status"=>$status,
                "speed"=>$speed,
                "optional"=>$optional,
                "duplex"=>$duplex
             );

             $links[] = $link_status;


        }

        header("Content-type: application/json");
        $data = array("errCode"=>0, "links"=>$links);
        echo json_encode($data);



    }
}

?>