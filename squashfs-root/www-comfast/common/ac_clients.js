define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);
    require('datatables')(d);
    require('tabletool')(d);

    var ac_group_info, vlan_list, aplist, new_aplist, current_ac_status, group_obj, tip_num = 0;
    var this_table, default_num = 10;
    var additional_device_list;
    var perfor_table;
    var vlan_config;

    var cur_mode = 2;

    var new_device_list, dhcp_list;
    var dropdown_list = [];
    var first_run = 0;
    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        d('#btn_aps_with_clients').addClass('active');
        refresh_init();
    }

    function refresh_init() {
        var dropdown_list_txt =  d.cookie('dropdown_list_client');

        if(typeof dropdown_list_txt == 'undefined')
        {
            first_run = 1;
        }
        else
            dropdown_list = JSON.parse(dropdown_list_txt);

        f.getMConfig('ac_group_config', function (data) {
            if (data && data.errCode == 0) {
                ac_group_info = data;
                vlan_list = data.vid_list || [];
                ac_group_init();
            }
        }, false);
        f.getMConfig('vlan_config', function (data) {
            if (data && data.errCode == 0) {
                vlan_config = data.vlan || [];
            }
        }, false);

        f.getSHConfig('ap_management.php?method=GET', function (data){
            if (data && data.errCode == 0) {
                additional_device_list = data.devices || [];
            }
        }, false);

        f.getMConfig('ac_list_get', function (data) {
            if (data && data.errCode == 0) {
                aplist = data.list_all || [];
                acap_status();
                showtable();
                showDropdownList();
            }
        });
    }


    
    et.changeDropdownListAll = function(evt){
        var val = evt.attr('data-value');
        var inputs = d('.dropdown-list').find('input[type="checkbox"]');
  
        dropdown_list = [];

        if(val == 0)
        {
            evt.attr('data-value', 1);
            d.each(inputs, function(n, m){
                d(m).attr('data-value', 1);
                var td_name = d(m).val();
                d('#perfor_table').find('.' + td_name).show();
                dropdown_list.push(td_name);

            });

        }
        else
        {
            evt.attr('data-value', 0);
            d.each(inputs, function(n, m){
                d(m).attr('data-value', 0);
                var td_name = d(m).val();
                d('#perfor_table').find('.' + td_name).hide();

            });
       }
       d.cookie('dropdown_list', JSON.stringify(dropdown_list));
    }

    et.changeDropdownList = function(evt) {
        var val = evt.attr('data-value');
        var td_name = evt.val();
        if(val == 0)
        {
            evt.attr('data-value', 1);
            d('#perfor_table').find('.' + td_name).show();
            var idx = dropdown_list.indexOf(td_name);
            if(idx < 0)
            {
                dropdown_list.push(td_name);
            }

        }
        else
        {
            evt.attr('data-value', 0);
            d('#perfor_table').find('.' + td_name).hide();
            var idx = dropdown_list.indexOf(td_name);
            if(idx >= 0)
            {
                dropdown_list.splice(idx, 1);
            }
        }

        d.cookie('dropdown_list_client', JSON.stringify(dropdown_list));
    }

    function get_vlan_name(vlan_id){
        var vlan_name = "Disabled";
        var metric = 0;
        if(vlan_id == 'lan') return vlan_name;
        if(vlan_id.indexOf('vlan') == 0)
        {
            vlan_id = vlan_id.substr(4);
            metric = parseInt(vlan_id);
        }
        d.each(vlan_config, function (n, m){
            if(m.id == metric)
            {
                vlan_name = m.desc;
                if(vlan_name == "")
                    vlan_name = m.iface.toUpperCase();

                return false;
            }
        });

        return vlan_name;
    }

    function getAdditionalInfo(mac_addr)
    {
        var add_info = {
            AP_MAC:"",
            DEVICE_MAC:"",
            DEVICE_IP:"",
            DEVICE_OS:"",
            DEVICE_HOSTNAME:"",
            auth:1,
            authorized:1,
            freq:0,
            iface:"",
            network:"",
            encryption:"",
            ssid:"",
            channel:"",
            hwmode:"",
            radio:"",
            RSSI:"",
            MAX_SIGNAL:"",
            SNR:"0",
            rx_speed:"0",
            tx_speed:"0"
        };
        d.each(additional_device_list, function(n, m){
            if(m.DEVICE_MAC.toLowerCase() == mac_addr.toLowerCase())
            {
                add_info = m;
                return false;
            }
        });

        
        return add_info;
    }

    function showDropdownList()
    {
        var inputs = d('.dropdown-list').find('input[type="checkbox"]');
        if(first_run == 1)
        {
            d.each(inputs, function(n, m){
                d(m).attr('data-value', 1);
                d(m).prop('checked', true);
                var td_name = d(m).val();
                d('#perfor_table').find('.' + td_name).show();
            });
        }
        else
        {
            d.each(inputs, function(n, m){
                var td_name = d(m).val();
                d(m).attr('data-value', 0);
                d('#perfor_table').find('.' + td_name).hide();
                d(m).prop('checked',  false);

                d.each(dropdown_list, function(idx, input){
                    if(input == td_name)
                    {
                        d(m).attr('data-value', 1);
                        d('#perfor_table').find('.' + td_name).show();
                        d(m).prop('checked', true);
                    }
                });
            });

        }

    }

    function acap_status() {
        if (aplist && (aplist.length > 0)) {
            current_ac_status = "ac";
        } else {
            current_ac_status = "ap";
        }
    }

    function ac_group_init() {
        if (!ac_group_info) {
            return;
        }
        getobjname();
        group_option()
    }

    function getobjname() {
        var group_num = ac_group_info.group_sum.group_sum;
        group_obj = [];
        if (group_num == 0) {
            f.getMConfig('add_default_group_config', function () {
                gohref();
            });
            return;
        }
        for (var i = 0; i < group_num; i++) {
            group_obj.push(ac_group_info['group' + i]);
        }
    }

    function group_option() {
        var this_html = '';
        d.each(group_obj, function (n, m) {
            if (m.group_name == 'ac_group_default') {
                this_html += '<option class="text-center" data-value="' + n + '" sh_lang="defalut_group" value="' + m.group_id + '">' + defalut_group + '</option>';
            } else {
                this_html += '<option class="text-center" data-value="' + n + '" value="' + m.group_id + '">' + m.group_name + '</option>';
            }
        });
        d('#acgroupselect').html(this_html);
    }

    function showtable() {
        d('#select_laber').text(selectall_tab);
        d('#allchecked').attr('data-value', '0');
        new_aplist = [];
        d.each(aplist, function (n, m) {
            if (m.offline_flag == 'online') {
                new_aplist.push(m);
            }
        });
        list_show();
    }

    function getRadioMode(hwmode)
    {
        if(hwmode == "") return "";
        return "802." + hwmode;
    }

    function list_show() {
        var perfor_html = '';
        var tr_cnt = 0;

        var wifi_client_count = 0;
        var wireless_24_cnt = 0;
        var wireless_58_cnt = 0;

        var ssid_list = [];

        f.getMConfig('dhcp_list', function (data) {
            if (data.errCode == 0) {
                dhcp_list = data.dhcp;
            }
        }, false);

        d('#perfor_table').dataTable().fnClearTable();
        d('#perfor_table').dataTable().fnDestroy();
        d.each(new_aplist, function (n, m) {
            var hasradio_24g = 0, hasradio_58g = 0, stacount_sum_24g = 0, stacount_sum_58g = 0, stacount_sum, ap_alias,
            group_config, group_config_name;

            ap_alias = m.alias;

            d.each(m.vif, function (x, y) {
                if (y.is_5g == 0) {
                    stacount_sum_24g += y.staCount;
                } else if (y.is_5g == 1) {
                    stacount_sum_58g += y.staCount;
                }

                if(!ssid_list.hasOwnProperty(y.ssid) && y.disabled == 0)
                    ssid_list[y.ssid] = 0;

            });

            d.each(m.radio, function (x, y) {
                if (y.is_5g == 0) {
                    hasradio_24g = 1;
                } else if (y.is_5g == 1) {
                    hasradio_58g = 1;
                }
            });

            stacount_sum = stacount_sum_24g + stacount_sum_58g;

            if (!hasradio_24g) {
                stacount_sum_24g = '*';
            }

            if (!hasradio_58g) {
                stacount_sum_58g = '*';
            }
            var is_defalut_group = 0;
            group_config = findgroup(m.mac);
            if (group_config.group_name == "" || group_config.group_name == "ac_group_default") {
                is_defalut_group = 1;
                group_config_name = defalut_group;
            } else {
                group_config_name = group_config.group_name;
            }
            var deviceReg = new RegExp("(.+)-(.+)");
            var deviceName = deviceReg.exec(m.soft_version)[1];
            var deviceVersion = deviceReg.exec(m.soft_version)[2];

            

           var data = {};
           var mac_addr = m.mac; //row_click.find('.apmac').text().toLowerCase();
   
          // if (open_flag == 0) {
               data.mac = mac_addr;
               /*
               f.getMConfig('dhcp_list', function (data) {
                   if (data.errCode == 0) {
                       dhcp_list = data.dhcp;
                   }
               }, false);
               */
               f.setMConfig('ac_list_sta_mac', data, function (data) {
                   if (data.errCode == 0) {
                       var ap_device = data.list_sta || [];
                       if (ap_device[0].vif.length > 0) {
                           device_list(ap_device);

                           wifi_client_count += new_device_list.length;
                           
                           d.each(new_device_list, function (n, m) {

                            if(m.is_5g == 0)
                                wireless_24_cnt ++;
                            else
                                wireless_58_cnt ++;

                            var ssid = m.ssid;
                            if(ssid_list.hasOwnProperty(ssid))
                                ssid_list[ssid]++;
                            else
                                ssid_list[ssid] = 1;


 
                            var add_info = getAdditionalInfo(m.terminalMac);


                            perfor_html += '<tr class="text-center" id="trinfo_' +tr_cnt + '">';
                            tr_cnt++;
                            perfor_html += '<td>' + tr_cnt  + '</td>';
                            perfor_html += '<td class="devicemac tbl_TerminalMac">' + m.terminalMac.toUpperCase() + '</td>';
                               perfor_html += '<td class="deviceip tbl_TerminalIp">' + m.terminalIP + '</td>';
                               perfor_html += '<td class="tbl_OS">' + ((add_info.DEVICE_OS == "") ? "*" : add_info.DEVICE_OS) + '</td>';
                               perfor_html += '<td class="tbl_DeviceName">' + ((add_info.DEVICE_HOSTNAME == "") ? "*" : add_info.DEVICE_HOSTNAME) + '</td>';
                               perfor_html += '<td class="tbl_HostName">' +ap_alias + '</td>';
                               perfor_html += '<td title="' + m.ssid + '" class="tbl_SSID">' + m.ssid.split('').slice(0, 16).join('') + '</td>';
                               if (m.is_5g == 0) {
                                perfor_html += '<td class="tbl_Type">2G</td>';
                               } else {
                                perfor_html += '<td class="tbl_Type">5G</td>';
                               }
                               perfor_html += '<td class="tbl_Channel">' + add_info.channel + '</td>';

                               perfor_html += '<td class="tbl_Vlan">' + get_vlan_name(add_info.network) + '</td>';
                               perfor_html += '<td class="tbl_Radio">' + getRadioMode(add_info.hwmode) + '</td>';
                               perfor_html += '<td class="tbl_Signal">' + m.signal + '</td>';
                               perfor_html += '<td class="tbl_SNR">' + add_info.SNR + '</td>';
                               perfor_html += '<td class="tbl_UpTime">' + g.uptime_str(m.linktime) + '</td>';
                               perfor_html += '<td class="tbl_RxSpeed">' + (add_info.rx_speed + "Mb/s") + '</td>';
                               perfor_html += '<td class="tbl_TxSpeed">' + (add_info.tx_speed + "Mb/s") + '</td>';
                               perfor_html += '<td class="tbl_TotalTx">' + g.bytesTosize(parseInt(m.txbyte) * 1024) + '</td>';
                               perfor_html += '<td class="tbl_TotalRx">' + g.bytesTosize(parseInt(m.rxbyte) * 1024) + '</td>';
                               perfor_html += '<td class="tbl_Status">' + ((add_info.authorized == 1) ? "Authorized" : "*") + '</td>';
                               perfor_html += '<td class="tbl_AuthMode">' + ((add_info.auth == 1) ? "OPEN" : "*") + '</td>';
                               
                               perfor_html += '</tr>';
                           });

                          

                       } else {
                       }
                   }
               }, false);
        });

        d("#perfor_tbody").html(perfor_html);
        if (tr_cnt > 0) {
            this_table = d('#perfor_table').DataTable({
                "aaSorting": [[1, "asc"]],
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true}
                ],
                "drawCallback": function () {
                   // d(":checkbox", d('#table_wrapper')).prop('checked', false);
                }
            });
            this_table.page.len(default_num).draw();
        }
       // showTableByMode(cur_mode);

       d('#wireless_24_cnt').html(wireless_24_cnt);
       d('#wireless_58_cnt').html(wireless_58_cnt);
       d('#wifi_client_count').html(wifi_client_count);

       var ssid_txt = "";

       for(var key in ssid_list)
       {
           ssid_txt += '<div class="row"><div class="col-lg-8"><span class="mrg-l-lg">' + key + ': </span></div><div class="col-lg-4"><span style="font-weight:bold;">' + ssid_list[key] + '</span><span>' + (ssid_list[key] == 0 ? ' client' : ' clients') + '</span></div></div>';

       }
       d('#ssid_list').html(ssid_txt);

       var height_1 = d('#box_ssid').height();
       var max_height = height_1;
       var height_2 =  d('#box_wireless').height();
       if(max_height < height_2)
        max_height = height_2;
       var height_3 = d('#box_wifi_total').height();
       if(max_height < height_3)
        max_height = height_3;

        d('#box_wifi_total').height(max_height);
        d('#box_wireless').height(max_height);
        d('#box_ssid').height(max_height);

       

    }


     //d("#perfor_tbody").on("click", ".row-click", function (n, m) {
     //   d("#perfor_tbody").load(function(){
     //   d("#perfor_tbody").on("change", ".row-click", function () {
         function loadChild(tr_item){
            var data = {};
            var row_click = d(tr_item);
            var trinfo = d(tr_item).attr("data-option");
            var open_flag = d(tr_item).attr("data-open");
            var mac_addr = row_click.find('.apmac').text().toLowerCase();
    
            if (open_flag == 0) {
                data.mac = mac_addr;
                f.getMConfig('dhcp_list', function (data) {
                    if (data.errCode == 0) {
                        dhcp_list = data.dhcp;
                    }
                }, false);
                f.setMConfig('ac_list_sta_mac', data, function (data) {
                    if (data.errCode == 0) {
                        var ap_device = data.list_sta || [];
                        if (ap_device[0].vif.length > 0) {
                            row_click.attr("data-open", "1");
                            //d("#" + trinfo).removeClass("hidden");
                            device_list(ap_device);
                            showchildtable(mac_addr.split(":").join(""));

                        } else {
                            //h.WarnTip(tip_num++, ac_noterminal);
                        }
                    }
                });
            } else {
                row_click.attr("data-open", "0");
                //d("#" + trinfo).addClass("hidden");
            }
        }

    function append_childtable(n, idx) {
        var tmp_html = '<table class="child_table">';
        tmp_html += '<thead id="child_heading_' + idx + '"><tr>';
        tmp_html += '<th class="text-center hidden"></th>';
        tmp_html += '<th class="text-center deviceip" style="width:10%"><span style="width:80px">' + ac_terminalIp + '</span></th>';
        tmp_html += '<th class="text-center devicemac" style="width:10%"><span style="width:120px">' + ac_terminalMac + '</span></th>';
        tmp_html += '<th class="text-center" style="width:10%"><span style="width:120px">' + ac_apSsid + '</span></th>';
        tmp_html += '<th class="text-center" style="width:10%"><span style="width:120px">' + ac_apSsidRange + '</span></th>';
        tmp_html += '<th class="text-center" style="width:10%"><span style="width:120px">' + ac_apSignal + '</span></th>';
        tmp_html += '<th class="text-center" style="width:10%"><span style="width:66px">' + ac_terminalLinkTime + '</span></th>';
        tmp_html += '<th class="text-center" style="width:10%"><span style="width:66px">' + ac_terminalTxByte + '</span></th>';
        tmp_html += '<th class="text-center" style="width:10%"><span style="width:66px">' + ac_terminalRxByte + '</span></th>';
        tmp_html += '</tr></thead>';
        tmp_html += '<tbody class="tbody_' + n.split(":").join("") + '" id="tbody_' + n.split(":").join("") + '">';
        tmp_html += '</tbody></table>';
        return tmp_html;
    }

    function findgroup(mymac) {
        var group_info = {};
        for (var i = 0; i < ac_group_info.group_sum.group_sum; i++) {
            var group_num_str = "group" + i;
            var one_group = ac_group_info[group_num_str];
            if (one_group.group_name && one_group.member_mac && (one_group.member_mac.indexOf(mymac) > -1)) {
                group_info = one_group;
                break;
            } else {
                group_info = ac_group_info['group0'];
            }
        }
        return group_info;
    }

    
    function device_list(data) {
        new_device_list = [];
        for (var a = 0; a < data.length; a++) {
            var alone_ap = data[a];
            for (var b = 0; b < alone_ap.vif.length; b++) {
                var alone_radio = alone_ap.vif[b];
                for (var c = 0; c < alone_radio.sta.length; c++) {
                    var alone_wifi_device = alone_radio.sta[c].msrtc;
                    var tmp_array = alone_wifi_device.split("|");
                    var tmp_info = {};
                    tmp_info.sup_mac = alone_ap.mac.toLowerCase();
                    tmp_info.sup_version = alone_ap.soft_version;
                    tmp_info.is_5g = alone_radio.is_5g;
                    tmp_info.ssid = alone_radio.ssid;
                    tmp_info.terminalMac = tmp_array[0].toLowerCase();
                    tmp_info.signal = tmp_array[1];
                    tmp_info.txbyte = tmp_array[2];
                    tmp_info.rxbyte = tmp_array[3];
                    tmp_info.linktime = tmp_array[4];
                    tmp_info.terminalIP = "*";
                    for (var d = 0; d < dhcp_list.length; d++) {
                        if (tmp_info.terminalMac == dhcp_list[d].mac) {
                            tmp_info.terminalIP = dhcp_list[d].ip;
                            break;
                        }
                    }
                    new_device_list.push(tmp_info);
                }
            }
        }
    }

    function showchildtable(macstr) {
        var this_html = '';
        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();
        d.each(new_device_list, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td>' + m.terminalIP + '</td>';
            this_html += '<td>' + m.terminalMac.toUpperCase() + '</td>';
            this_html += '<td title="' + m.ssid + '">' + m.ssid.split('').slice(0, 16).join('') + '</td>';
            if (m.is_5g == 0) {
                this_html += '<td>2G</td>';
            } else {
                this_html += '<td>5G</td>';
            }

            this_html += '<td>' + m.signal + '</td>';
            this_html += '<td>' + g.uptime_str(m.linktime) + '</td>';
            this_html += '<td>' + g.bytesTosize(parseInt(m.txbyte) * 1024) + '</td>';
            this_html += '<td>' + g.bytesTosize(parseInt(m.rxbyte) * 1024) + '</td>';
            this_html += '</tr>';
        });

        d("#tbody_" + macstr).html(this_html);
        if (new_device_list.length > 0) {
            this_table = d('#table').DataTable({
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true}
                ],
                "drawCallback": function () {
                    d(":checkbox", d('#table_wrapper')).prop('checked', false);
                }
            });
            this_table.page.len(default_num).draw();
        }
    }

    function showTableByMode(_mode)
    {
        if(_mode == 0)
        {
            d('#btn_aps_only').addClass('active');
            d('tr[id^=trinfo_]').addClass('hide');
            d('tr[id^=tr_]').removeClass('hide');
            d('thead[id=parent_heading]').removeClass('hide');
            d('thead[id^=child_heading_]').addClass('hide');
            d('tr[id^=tr_]').removeClass('table-aps');
            d('.child_table').removeClass('table-device');
            d('#perfor_table').addClass('table-hover');
        }
        else if(_mode == 1)
        {
            d('#btn_aps_with_clients').addClass('active');
            d('tr[id^=trinfo_]').removeClass('hide');
            d('tr[id^=tr_]').removeClass('hide');
            d('thead[id=parent_heading]').removeClass('hide');
            d('thead[id^=child_heading_]').removeClass('hide');
            d('tr[id^=tr_]').addClass('table-aps');
            d('.child_table').addClass('table-device');
            d('#perfor_table').removeClass('table-hover');
        }
        else if(_mode == 2)
        {
            d('tr[id^=trinfo_]').removeClass('hide');
            /*
            d('#btn_wifi_clients').addClass('active');
            
            d('tr[id^=tr_]').addClass('hide');
            d('thead[id=parent_heading]').addClass('hide');
            d('thead[id^=child_heading_]').addClass('hide');
            d('#child_heading_0').removeClass('hide');
            d('tr[id^=tr_]').removeClass('table-aps');
            d('.child_table').removeClass('table-device');
            d('#perfor_table').addClass('table-hover');
            */

        }
    }

    et.changeTab = function(evt)
    {
        var id = evt.attr('id');
        d('#btn_aps_only').removeClass('active');
        d('#btn_aps_with_clients').removeClass('active');
        d('#btn_wifi_clients').removeClass('active');
        if(id == 'btn_aps_only')
        {
            cur_mode = 0;
            showTableByMode(cur_mode);
        }
        else if(id == 'btn_aps_with_clients')
        {
            cur_mode = 1;
            showTableByMode(cur_mode);
        }
        else if(id == 'btn_wifi_clients')
        {
            cur_mode = 2;
            showTableByMode(cur_mode);
        }
       
    }



    d('#seach_device_mac').keyup(function () {
        var search_value = d(this).val().replace(/(^\s+)|(\s+$)/g, "");

        if (search_value != '') {
            d('tr[id^=trinfo_]').addClass('hide');
            d('tr[id^=tr_]').addClass('hide');

            if(cur_mode == 0)
            {
                d('.apmac').each(function(n, m){
                     if(d(m).html().toLowerCase().indexOf(search_value.toLowerCase()) >= 0)
                    {
                        d(m).parents('tr[id^=tr_]').removeClass('hide');
                    }
                });
    
                d('.apip').each(function(n, m){
                    if(d(m).html().toLowerCase().indexOf(search_value.toLowerCase()) >= 0)
                    {
                        d(m).parents('tr[id^=tr_]').removeClass('hide');
                    }
                });
            }
            else if(cur_mode == 1)
            {
                d('.apmac').each(function(n, m){
                    if(d(m).html().toLowerCase().indexOf(search_value.toLowerCase()) >= 0)
                    {
                        d(m).parents('tr[id^=tr_]').removeClass('hide');
                    }
                });
    
                d('.apip').each(function(n, m){
                    if(d(m).html().toLowerCase().indexOf(search_value.toLowerCase()) >= 0)
                    {
                        d(m).parents('tr[id^=tr_]').removeClass('hide');
                    }
                });
                d('.devicemac').each(function(n, m){
                     if(d(m).html().toLowerCase().indexOf(search_value.toLowerCase()) >= 0)
                    {
                        d(m).parents('tr[id^=trinfo_]').removeClass('hide');
                    }
                });
                d('.deviceip').each(function(n, m){
                    if(d(m).html().toLowerCase().indexOf(search_value.toLowerCase()) >= 0)
                    {
                        d(m).parents('tr[id^=trinfo_]').removeClass('hide');
                    }
                });

            }
            else 
            {
                d('.devicemac').each(function(n, m){
                    if(d(m).html().toLowerCase().indexOf(search_value.toLowerCase()) >= 0)
                    {
                        d(m).parents('tr[id^=trinfo_]').removeClass('hide');
                    }
                });
                d('.deviceip').each(function(n, m){
                    if(d(m).html().toLowerCase().indexOf(search_value.toLowerCase()) >= 0)
                    {
                        d(m).parents('tr[id^=trinfo_]').removeClass('hide');
                    }
                });
            }

        } else {
            showTableByMode(cur_mode);
        }
    });

    b.init = init;
});
