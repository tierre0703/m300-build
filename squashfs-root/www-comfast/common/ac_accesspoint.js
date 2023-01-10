define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        i = require('channels_select'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);
    require('datatables')(d);
    require('tabletool')(d);

    var ac_group_info, vlan_list, aplist, current_ac_status, group_obj, one_radio_wifi, one_device, wifi_langht,  dev_config = {};
    var perfor_table, manage_table, lock_web = false, tip_num = 0, default_num = 10, wilrmaxnum = 7, interval_flush, flush_time = 'auto';
    var vlan_config = [];

    var long_save = false;
    var refresh_after_save = false;

    var arp_info;
    var first_run = 0;
    var b_show_24 = 1;

    var desc_info = [];

    var dropdown_list = [];

    var ap_link;

    var weeks_num = ['1', '2', '3', '4', '5', '6', '0'];

    function init() {
        d('.select_line').val(default_num);
        d('.select_flush').val(flush_time);
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
       


        
        refresh_init();
    }

    function refresh_init() {

        var dropdown_list_txt =  d.cookie('dropdown_list');
        if(typeof dropdown_list_txt == 'undefined')
        {
            first_run = 1;
        }
        else
            dropdown_list = JSON.parse(dropdown_list_txt);

        b_show_24 = d.cookie('b_show_24') || 1;

        if(b_show_24 == 1)
        {
            d('#btnShow58').removeClass('active');
            d('#btnShow24').addClass('active');
            d('#btnShow24').attr('data-value', 1);
            d('#btnShow58').attr('data-value', 0);
        }
        else
        {
            d('#btnShow58').addClass('active');
            d('#btnShow24').removeClass('active');
            d('#btnShow24').attr('data-value', 0);
            d('#btnShow58').attr('data-value', 1);
        }


        f.getMConfig('ac_group_config', function (data) {
            if (data && data.errCode == 0) {
                ac_group_info = data;
                vlan_list = data.vid_list || [];
                ac_group_init();
            }
        }, false);

        f.getMConfig('arp_list', function (arplist) {
            if (arplist && arplist.errCode == 0) {
                arp_info = arplist.arp_list || [];
                
            }
        }, false);

        f.getMConfig('vlan_config', function (data) {
            if (data && data.errCode == 0) {
                vlan_config = data.vlan || [];
            }
        }, false);

        f.getSHConfig('ap_config.php?method=GET&action=desc', function (data){
            desc_info = data;
        }, false);

        f.getSHConfig('ap_management.php?method=GET&action=ap_link', function (data){
            ap_link = data.ap_link || [];
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

    et.movegroup = function (evt) {
        var arg;
        if (lock_web) {
            return;
        }
        lock_web = true;
        if (arg = volid_movegroup(evt)) {
            set_apconfig(arg);
        } else {
            lock_web = false;
        }
    };

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
                d('#manage_table').find('.' + td_name).show();
                dropdown_list.push(td_name);

            });

        }
        else
        {
            evt.attr('data-value', 0);
            d.each(inputs, function(n, m){
                d(m).attr('data-value', 0);
                var td_name = d(m).val();
                d('#manage_table').find('.' + td_name).hide();

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
            d('#manage_table').find('.' + td_name).show();
            var idx = dropdown_list.indexOf(td_name);
            if(idx < 0)
            {
                dropdown_list.push(td_name);
            }

        }
        else
        {
            evt.attr('data-value', 0);
            d('#manage_table').find('.' + td_name).hide();
            var idx = dropdown_list.indexOf(td_name);
            if(idx >= 0)
            {
                dropdown_list.splice(idx, 1);
            }
        }

        d.cookie('dropdown_list', JSON.stringify(dropdown_list));
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
                d('#manage_table').find('.' + td_name).show();
            });
        }
        else
        {
            d.each(inputs, function(n, m){
                var td_name = d(m).val();
                d(m).attr('data-value', 0);
                d('#manage_table').find('.' + td_name).hide();
                d(m).prop('checked',  false);

                d.each(dropdown_list, function(idx, input){
                    if(input == td_name)
                    {
                        d(m).attr('data-value', 1);
                        d('#manage_table').find('.' + td_name).show();
                        d(m).prop('checked', true);
                    }
                });
            });

        }

    }

    function volid_movegroup() {
        var a = {}, this_checked, group_array = [];

        this_checked = d('#manage_tbody').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }

        this_checked.each(function (n, m) {
            group_array[n] = {};
            group_array[n].member_mac = d(m).parents('tr').find('.apmac').text().toLowerCase();
            group_array[n].group_id_old = d(m).parents('tr').find('.ap_group_oid').text();
            group_array[n].group_id_new = d('#acgroupselect').val();
            group_array[n].group_name = d('#acgroupselect').find("option:selected").text();
        });
        a.group_member_list = group_array;
        return a;
    }

    et.changeGroup = function(evt){

        long_save = false;
        refresh_after_save = false;

        var selected_group = evt.val();

        var a = {}, this_checked, group_array = [];

        group_array[0] = {};
        group_array[0].member_mac = evt.parents('tr').find('.apmac').text().toLowerCase();
        group_array[0].group_id_old = evt.parents('tr').find('.ap_group_oid').text();
        group_array[0].group_id_new = selected_group;
        group_array[0].group_name = evt.find("option:selected").text();
        
        a.group_member_list = group_array;

        SetActiveApply();
        set_apconfig(a);
    }

    et.head_nav = function (evt) {
        if (evt.attr('data-value') == 'perfor') {
            d('#manage_nav').addClass('hide');
        } else if (evt.attr('data-value') == 'manage') {
            d('#manage_nav').removeClass('hide');
        }
    };

    et.flush = function (evt) {
        if (evt.val() != 'auto') {
            flush_time = evt.val() * 60 * 1000;
            if (interval_flush != '') {
                clearInterval(interval_flush);
            }
            interval_flush = setInterval(refresh_init, flush_time);
        } else {
            flush_time = evt.val();
            clearInterval(interval_flush)
        }

        d(evt).blur();
    };

    et.click_flush = function () {
        refresh_init();
    };

    et.displayline = function (evt) {
        default_num = d(evt).val();
        perfor_table.page.len(default_num).draw();
        manage_table.page.len(default_num).draw();
        d(evt).blur();
    };

    function showtable() {
        d('#select_laber').text(selectall_tab);
        d('#allchecked').attr('data-value', '0');

        aplist.sort(function (n, m) {
            if (n.offline_flag == 'online') {
                n.online = '1';
            } else {
                n.online = '0';
            }

            if (m.offline_flag == 'online') {
                m.online = '1';
            } else {
                m.online = '0';
            }

            return m.online - n.online;
        });
        list_show();
    }

    function getIPFromMac(mac)
    {
        //here ap's mac address is different with the arp list
        var macToken = mac.substr(0, mac.length - 2);
        for(var i = 0; i < arp_info.length; i++)
        {
            if(arp_info[i].mac.toLowerCase().indexOf(macToken) == 0)
            {
                return arp_info[i].ip;
            }
        }
        return "";
    }

    function group_list(cur_group)
    {

        var this_html = '';
        d.each(group_obj, function (n, m) {
            if (m.group_name == 'ac_group_default') {
                if(cur_group == m.group_name || typeof cur_group == 'undefined')
                {
                    this_html += '<option class="text-center" data-value="' + n + '" sh_lang="defalut_group" value="' + m.group_id + '" selected>' + defalut_group + '</option>';
                }
                else
                {
                    this_html += '<option class="text-center" data-value="' + n + '" sh_lang="defalut_group" value="' + m.group_id + '">' + defalut_group + '</option>';
                }
            } else {
                if(cur_group == m.group_name)
                {
                    this_html += '<option class="text-center" data-value="' + n + '" value="' + m.group_id + '" selected>' + m.group_name + '</option>';
                }
                else
                {
                    this_html += '<option class="text-center" data-value="' + n + '" value="' + m.group_id + '">' + m.group_name + '</option>';
                }
            }
        });
        return this_html;
    }

    function list_show() {
        var perfor_html = '', manage_html = '';

        var access_points_count,online_ap_count = 0,offline_ap_count=0,_24ghz_ap_count = 0,_58ghz_ap_count = 0;
        var group_count = 0,ssid_count = 0,ssid_24_count = 0,ssid_58_count = 0;
        var group_info = [];

        d('#perfor_table').dataTable().fnClearTable();
        d('#perfor_table').dataTable().fnDestroy();
        d('#manage_table').dataTable().fnClearTable();
        d('#manage_table').dataTable().fnDestroy();

        if(b_show_24 == 1)
        {
            d('.tbl_24GHzSSID').removeClass('hide');
            d('.tbl_58GHzSSID').addClass('hide');
        }
        else
        {
            d('.tbl_24GHzSSID').addClass('hide');
            d('.tbl_58GHzSSID').removeClass('hide');
        }

        access_points_count = aplist.length;
        group_count = group_obj.length;
        d.each(group_obj, function (n, m) {
            var group_name = "";
            if(m.group_name == "ac_group_default")
                group_name = defalut_group;
            else
                group_name = m.group_name;

            var active_24_ssid = 0;
            var active_58_ssid = 0;

            d.each(m.vif, function(vid_idx, vid_info){
                
                if(vid_info.disabled == 1) return;

                if(vid_info.is_5g == 1)
                {
                    ssid_count++;
                    ssid_58_count++;
                    active_58_ssid ++;

                }
                else
                {
                    ssid_count++;
                    ssid_24_count++;
                    active_24_ssid++;
                }
            });

            group_info[group_name] = {online_ap:0, offline_ap:0, ssid:(active_58_ssid + active_24_ssid)};
        });

        var ap_index = 0;


        d.each(aplist, function (n, m) {
            var hasradio_24g = 0, hasradio_58g = 0, stacount_sum_24g = 0, stacount_sum_58g = 0, stacount_sum, txbytes_sum = 0, rxbytes_sum = 0;
            var txbytes_sum_24g = 0, txbytes_sum_58g = 0, ssid_24g = [], ssid_58g = [], maxassoc_24g, maxassoc_58g, ap_status;
            var txpowerlevel_24g, txpowerlevel_58g, channel_24g, channel_58g;
            var group_config, group_config_name;

           



            if (m.vif.length < 1) {
                return true;
            }
            for (var x = 0; x < m.vif.length; x++) {
                var y = m.vif[x];
                if (y.tx_bytes == '' || y.tx_bytes == undefined) {
                    y.tx_bytes = '0';
                }
                if (y.rx_bytes == '' || y.rx_bytes == undefined) {
                    y.rx_bytes = '0';
                }
                if (y.is_5g == 0) {
                    stacount_sum_24g += y.staCount;
                    txbytes_sum_24g += parseInt(y.tx_bytes);
                    ssid_24g.push(y.ssid);
                    if(y.disabled == 0)
                    {
                       // active_24_ssid++;
                        //ssid_count++;
                       // ssid_24_count++;
                    }
                        
                } else if (y.is_5g == 1) {
                    stacount_sum_58g += y.staCount;
                    txbytes_sum_58g += parseInt(y.tx_bytes);
                    ssid_58g.push(y.ssid);
                    if(y.disabled == 0)
                    {
                       // active_58_ssid++;
                        //ssid_count++;
                        //ssid_58_count++;
                    }
                        
                }
                txbytes_sum += parseInt(y.tx_bytes);
                rxbytes_sum += parseInt(y.rx_bytes);
            }

            d.each(m.radio, function (x, y) {
                if (y.is_5g == 0) {
                    txpowerlevel_24g = (y.txpower_level != '0' ? (y.txpower_level || '1000') : '0') / 10 + '%';
                    channel_24g = y.channel || 'auto';
                    hasradio_24g = 1;
                } else if (y.is_5g == 1) {
                    txpowerlevel_58g = (y.txpower_level != '0' ? (y.txpower_level || '1000') : '0') / 10 + '%';
                    channel_58g = y.channel || 'auto';
                    hasradio_58g = 1;
                }
            });

            if(hasradio_24g)
                _24ghz_ap_count++;
            if(hasradio_58g)
                _58ghz_ap_count++;



            txbytes_sum = g.bytesTosize(txbytes_sum);
            rxbytes_sum = g.bytesTosize(rxbytes_sum);
            txbytes_sum_24g = g.bytesTosize(txbytes_sum_24g);
            txbytes_sum_58g = g.bytesTosize(txbytes_sum_58g);

            if (m.offline_flag == 'online') {
                ap_status = acconfig_online;
                online_ap_count++;
            } else {
                ap_status = acconfig_offline;
                offline_ap_count++;
            }
            stacount_sum = stacount_sum_24g + stacount_sum_58g;

            maxassoc_24g = m.wlan_maxassoc_24g;
            maxassoc_58g = m.wlan_maxassoc_5g;

            if (!hasradio_24g) {
                stacount_sum_24g = '*';
                txbytes_sum_24g = '*';
                ssid_24g.push('*');
                maxassoc_24g = '*';
                txpowerlevel_24g = '*';
                channel_24g = '*'
            }

            if (!hasradio_58g) {
                stacount_sum_58g = '*';
                txbytes_sum_58g = '*';
                ssid_58g.push('*');
                maxassoc_58g = '*';
                txpowerlevel_58g = '*';
                channel_58g = '*'
            }
            var is_defalut_group = 0;
            group_config = findgroup(m.mac);
            if (group_config.group_name == "" || group_config.group_name == "ac_group_default") {
                is_defalut_group = 1;
                group_config_name = defalut_group;
            } else {
                group_config_name = group_config.group_name;
            }

            if(m.offline_flag == 'online')
                group_info[group_config_name].online_ap++;
            else
                group_info[group_config_name].offline_ap++;

           // group_info[group_config_name].ssid_24_count += active_24_ssid;
          //  group_info[group_config_name].ssid_58_count += active_58_ssid;

            



            var deviceReg = new RegExp("(.+)-(.+)");
            var deviceName = deviceReg.exec(m.soft_version)[1];
            var deviceVersion = deviceReg.exec(m.soft_version)[2];

            perfor_html += '<tr class="text-center">';
            perfor_html += '<td>' + (ap_index + 1) + '</td>';
            
            perfor_html += '<td class="apmac">' + m.mac.toUpperCase() + '</td>';
            perfor_html += '<td>' + m.wan_ip + '</td>';
            perfor_html += '<td>' + stacount_sum_24g + '/' + stacount_sum_58g + '/' + stacount_sum + '</td>';
            perfor_html += '<td>';
            perfor_html += rxbytes_sum + '/' + txbytes_sum;
            perfor_html += '</td>';
            if (m.ssid_vid_sup == 1) {
                perfor_html += '<td>' + global_support + '</td>';
            } else {
                perfor_html += '<td>' + global_nonsupport + '</td>';
            }

            perfor_html += '<td>' + g.formatsecond(m.uptime) + '</td>';
            if(ap_status == 'online')
            perfor_html += '<td>' + ap_status + '</td>';
            if (is_defalut_group) {
                perfor_html += '<td sh_lang="defalut_group">' + group_config_name + '</td>';
            } else {
                perfor_html += '<td title="' + group_config_name + '">' + g.omittext(group_config_name, 6) + '</td>';
            }
            perfor_html += '<td >' + m.alias + '</td>';
            if (m.led_state == '1') {
                perfor_html += '<td><span class="fa-stack"><i class="fa fa-closeglim fa-stack-2x"></i></span></td>';
            } else {
                perfor_html += '<td><span class="fa-stack"><i class="fa fa-openglim fa-stack-2x" style="color: #0e90d2"></i></span></td>';
            }
            perfor_html += '</tr>';

            if (ssid_24g.length < 1) {
                ssid_24g[0] = "undefined";
            }

            if (ssid_58g.length < 1) {
                ssid_58g[0] = "undefined";
            }

            var desc = m.alias;

            d.each(desc_info, function(desc_idx, _info){
                if(_info.mac == m.mac.toLowerCase())
                {
                    desc = _info.desc;
                    return false;
                }

            });

            manage_html += '<tr class="text-center">';
            manage_html += '<td class="hide"><input class="row-checkbox" type="checkbox" /></td>';
            manage_html += '<td>' + (ap_index + 1) + '</td>';
            ap_index ++;
            manage_html += '<td class="tbl_Description"><input type="text" value="' + m.alias + '" style="min-width:170px" id="description_' + n + '" class="input_description border_light_grey" et="blur:changeDescription" /></td>';
            manage_html += '<td class="tbl_IPAddress">' + m.wan_ip + '</td>';
            manage_html += '<td class="apmac tbl_MAC">' + m.mac.toUpperCase() + '</td>';
            if(b_show_24 == 1)
            {
                manage_html += '<td class="tbl_24GHzSSID" title="' + ssid_24g[0] + '">' + ssid_24g[0].split('').slice(0, 16).join('') + '</td>';
                manage_html += '<td class="tbl_58GHzSSID hide" title="' + ssid_58g[0] + '">' + ssid_58g[0].split('').slice(0, 16).join('') + '</td>';
                manage_html += '<td class="tbl_Capacity">' + maxassoc_24g + '</td>';
                manage_html += '<td class="tbl_TransmitPower">' + txpowerlevel_24g + '</td>';
                manage_html += '<td class="tbl_Channel">' + channel_24g + '</td>';
            
            }
            else
            {
                manage_html += '<td class="tbl_24GHzSSID hide" title="' + ssid_24g[0] + '">' + ssid_24g[0].split('').slice(0, 16).join('') + '</td>';
                manage_html += '<td class="tbl_58GHzSSID" title="' + ssid_58g[0] + '">' + ssid_58g[0].split('').slice(0, 16).join('') + '</td>';
                manage_html += '<td class="tbl_Capacity">' + maxassoc_58g + '</td>';
                manage_html += '<td class="tbl_TransmitPower">' + txpowerlevel_58g + '</td>';
                manage_html += '<td class="tbl_Channel">' + channel_58g + '</td>';
            }
           
            manage_html += '<td class="tbl_UpDown">' + rxbytes_sum + '/' + txbytes_sum + '</td>';
            manage_html += '<td class="tbl_Device">' + deviceName.toUpperCase() + '</td>';
            manage_html += '<td class="tbl_SWVersion">' + deviceVersion + '</td>';
          
           manage_html += '<td class="form_right tbl_SSIDVLAN">' + get_vlan_name(m.vid) + '</td>';
           
           if(b_show_24 == 1)
                manage_html += '<td class="form_right tbl_GroupVLAN td-vlan"><span class="multivlan" title=\'' + get_group_vlan_name(group_config.group_id, b_show_24, false) + '\'>' + get_group_vlan_name(group_config.group_id,  b_show_24, true) + '</span></td>';
            else
                manage_html += '<td class="form_right tbl_GroupVLAN td-vlan"><span class="multivlan" title=\'' + get_group_vlan_name(group_config.group_id, b_show_24, false) + '\'>' + get_group_vlan_name(group_config.group_id,  b_show_24, true) + '</span></td>';

           
           manage_html += '<td class="tbl_Uptime">' + g.formatsecond(m.uptime) + '</td>';

            
            manage_html += '<td class="tbl_CurrentGroup"><select i="group_' + n + '" et="change:changeGroup" class="border_light_grey">' + group_list(group_config_name) + '</select></td>';

            if(m.offline_flag == 'online')
            {
                manage_html += '<td class="tbl_Status">' + ap_status + '<span class="dot-blue"></span></td>';
            }
            else
            {
                manage_html += '<td class="tbl_Status">' + ap_status + '<span class="dot-red"></span></td>';

            }

            var link_speed = "";

            var dot_txt = "";

            d.each(ap_link, function(ap_idx, link_info){
                if(m.mac.toLowerCase() == link_info.wan_macaddr.toLowerCase() ||
                m.mac.toLowerCase() == link_info.lan_macaddr.toLowerCase())
                {
                    if(link_info.wan_speed != "")
                        link_speed = link_info.wan_speed + " Mbps";
                    
                    return false;
                }
            });
         
            manage_html += '<td class="tbl_LinkStatus"><span>' + link_speed + '</span></td>';

            if (m.led_state == '1') {
                manage_html += '<td class="hide"><span class="fa-stack"><i class="fa fa-closeglim fa-stack-2x"></i></span></td>';
            } else {
                manage_html += '<td class="hide"><span class="fa-stack"><i class="fa fa-openglim fa-stack-2x" style="color: #0e90d2"></i></span></td>';
            }

            




            if (m.radio.length == 0) {
                manage_html += '<td><a data-toggle="modal" class="table-link gray"><span class="fa-stack" et="click tap:editlist"><i class="fa fa-square fa-stack-2x"></i><i data-modal="modal-4"  title="' + edit + '" class="md-trigger fa fa-pencil fa-stack-1x fa-inverse"></i></span></a><a class="table-link danger"><span class="fa-stack" et="click tap:delap"><i class="fa fa-square fa-stack-2x" ></i><i class="fa fa-trash-o fa-stack-1x fa-inverse"  title="' + ac_group_del_btn + '"></i></span></a></td>';
            } else {
                manage_html += '<td><a data-toggle="modal" data-target="#modal_edit" class="table-link" et="click tap:editlist"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i data-modal="modal-4"  title="' + edit + '" class="md-trigger fa fa-pencil fa-stack-1x fa-inverse"></i></span></a><a class="table-link danger"><span class="fa-stack" et="click tap:delap"><i class="fa fa-square fa-stack-2x" ></i><i class="fa fa-trash-o fa-stack-1x fa-inverse"  title="' + ac_group_del_btn + '"></i></span></a></td>';
            }
            manage_html += '<td class="ap_list_num hidden">' + n + '</td>';
            manage_html += '<td class="ap_group_oid hidden">' + group_config.group_id + '</td>';
            manage_html += '<td class="ap_group_name hidden">' + group_config.group_name + '</td>';
            manage_html += '</tr>';
        });
        d("#perfor_tbody").html(perfor_html);
        d("#manage_tbody").html(manage_html);
        d('.input_description').on('blur', function(e){
            var val = d(this).val();
            if(val == "") return;
            
            //long_save = true;
            //refresh_after_save = false;
            SetActiveApply();

            //changeDescription(d(this));
        });
       
        $.widget("ui.tooltip", $.ui.tooltip, {
            options: {
                content: function () {
                    return $(this).prop('title');
                }
            }
        });
        $('.multivlan').tooltip({
            position: {
             
                using: function (position, feedback) {
                    $(this).css(position);
                    $("<div>")
                        .addClass("arrow")
                        .addClass(feedback.vertical)
                        .addClass(feedback.horizontal)
                        .appendTo(this);
                }
            }
        });
       

        if (aplist.length > 0) {
            perfor_table = d('#perfor_table').DataTable({
                "bDestroy": true,
                "aaSorting": [[0, "asc"]],
                "columns": [
                    null,
                    null,
                    {"orderable": false},
                    null,
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    null,
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false}
                ],
                "drawCallback": function (settings) {
                    //??????
                    //laber_text(false);
                    d(":checkbox", d('#table_wrapper')).prop('checked', false);
                }
            });
            perfor_table.page.len(default_num).draw();

            manage_table = d('#manage_table').DataTable({
                "bDestroy": true,
                "aaSorting": [[1, "asc"]],
                "columns": [
                    {"orderable": false},
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                ],
                "drawCallback": function (settings) {
                    //??????
                    laber_text(false);
                    d(":checkbox", d('#manage_table_wrapper')).prop('checked', false);
                }
            });
            manage_table.page.len(default_num).draw();
        }

        d('#access_points_count').html(access_points_count);
        d('#online_ap_count').html(online_ap_count);
        d('#offline_ap_count').html(offline_ap_count);
        d('#_24ghz_ap_count').html(_24ghz_ap_count);
        d('#_58ghz_ap_count').html(_58ghz_ap_count);

        var group_html = "";
        var group_ssid_html = "";
        //d.each(group_info, function(group_idx, info){
            group_count = 0;
        for(var group_idx in group_info)
        {
            if(group_idx == defalut_group && (group_info[group_idx].online_ap == 0 && group_info[group_idx].offline_ap == 0)){}
            else
            {
                group_html+= "<div><div class='col-lg-4 text-left'><span>" + group_idx + ":</span></div><div class='col-lg-8 text-right'><span style='font-weight:bold'> " + (group_info[group_idx].online_ap + group_info[group_idx].offline_ap) + " APs </span><span>("+group_info[group_idx].online_ap+" On-line; "+group_info[group_idx].online_ap+" Off-line)</span></div>";
                group_count++;

            }

            if(group_idx == defalut_group && group_info[group_idx].ssid == 0){}
            else group_ssid_html += "<div><div class='col-lg-6 text-left'><span>" +group_idx + ": </span></div><div class='col-lg-6 text-right'><span style='font-weight:bold;'>"+ group_info[group_idx].ssid + " SSIDs</span></div></div></div>";

        }
        d('#group_count').html(group_count);
       d('#group_count_info').html(group_html);

       d('#ssid_count').html(ssid_count);
       d('#ssid_24_count').html(ssid_24_count);
       d('#ssid_58_count').html(ssid_58_count);
       d('#ssid_list').html(group_ssid_html);

       
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

    d('#manage_table').on("change", ":checkbox", function () {
        if (d(this).is("[name='checked-all']")) {
            d(":checkbox:enabled", d('#manage_table')).prop("checked", d(this).prop("checked"));
            laber_text(d(this).prop("checked"));
        } else {
            var checkbox = d("tbody :checkbox:enabled", d('#manage_table'));
            d(":checkbox[name='checked-all']", d('#manage_table')).prop('checked', checkbox.length == checkbox.filter(':checked:enabled').length);
            laber_text(checkbox.length == checkbox.filter(':checked:enabled').length);
        }
    }).on("click", ".row-checkbox", function (event) {
        !d(event.target).is(":checkbox") && d(":checkbox", this).trigger("click");
    });

    function SetActiveApply()
    {
        d('#btnApplySetting').addClass('active');
        h.WarnTip(tip_num++, need_change);
    }

    function laber_text(status) {
        if (status) {
            d("[for='allchecked']").text(disselectall_tab);
        } else {
            d("[for='allchecked']").text(selectall_tab);
        }
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

    et.editlist = function (evt) {
        clear_all();
        d('li[id^="tab_nav_"]').removeClass('hide');
        var array_num = evt.parents('tr').find('.ap_list_num').html();
        ap_config_show(array_num);
    };


    function changeDescription(evt) {
        return;
        clear_all();
        var new_alias = evt.val();
        var num = evt.parents('tr').find('.ap_list_num').html();
        //ap_config_show(array_num);

        one_device = aplist[num];
        var wifi_list_id, ssid_id, passwd_id, vlan_id, disabled_id;
        var hwmode_id, htmode_id, shortgi_id, txpower_id, txpower, encrypt_id;
        var disabled_mgnt, hidessid_mgnt, ssid_mgnt, encry_mgnt, key_mgnt;
        var radio_sum = one_device.radio.length;

        if (radio_sum && radio_sum < 2) {
            show_div_box(one_device);
        } else {
            d('[id^=tab_nav_]').removeClass('hide');
        }

        d('#wifitab>li').each(function (n, m) {
            if (!d(m).hasClass('hide')) {
                d(m).click();
                return false;
            }
        });

        ceartrwinfo(one_device);

        g.swich('#switch_hidessid_24g', one_device.wlan_hidden_24g);
        g.swich('#switch_hidessid_58g', one_device.wlan_hidden_5g);

        one_device.alias = new_alias;

        d('#rename_alias').val(one_device.alias);
        d('#wlan_beacon_int').val(one_device.wlan_beacon_int || 100);
        d('#radio_rts').val(one_device.radio_rts || 2347);
        d('#wlan_dtim_period').val(one_device.wlan_dtim_period || 2);
        d('#maxassoc_24g').val(one_device.wlan_maxassoc_24g);
        d('#maxassoc_58g').val(one_device.wlan_maxassoc_5g);
        g.swich('#switch_isolate', one_device.wlan_isolate || 0, 1);

        d("#kickout_check_period").val(one_device.kickout_check_period);
        d("#kickout_kickout_period").val(one_device.kickout_kickout_period / 60);
        d("#kickout_signal_flag").val(one_device.kickout_signal_flag);
        g.swich('#switch_wlroam', one_device.kickout_disable, 0);

        if (one_device.timing_weeks != undefined) {
            var timing_weeks = one_device.timing_weeks;

            if (timing_weeks != '') {
                checked_week(timing_weeks.split(','));
            }

            d('#times_0').val(one_device.timing_time);
            g.swich('#reboot_switch', one_device.timing_enable);
            if (one_device.timing_enable == '1') {
                d('#workdays').removeClass('hidden');
                d('#times_0').attr('disabled', false);
            } else {
                d('#workdays').addClass('hidden');
                d('#times_0').attr('disabled', true);
            }

            g.swich('#interval_enable', one_device.interval_enable);
            if (one_device.interval_enable == '1') {
                d('#interval_time_box').removeClass('hidden');
                d('#interval_redial_time').attr('disabled', false);
            } else {
                d('#interval_time_box').addClass('hidden');
                d('#interval_redial_time').attr('disabled', true);
            }
            d('#interval_redial_time').val(one_device.interval_time);
        }


        d.each(one_radio_wifi, function (n, m) {
            var handle_html, this_html;

            hwmode_id = '#hwmode_' + m.flag;
            txpower_id = '#txpower_' + m.flag;
            disabled_id = '#switch_wireless_' + m.flag;
            htmode_id = '#htmode_' + m.flag;
            shortgi_id = '#short_gi_' + m.flag;

            d(htmode_id).val(m.htmode);

            if (m.flag == '24g') {
                d(hwmode_id).val(m.hwmode)
            }

            txpower = m.txpower_level;
            if (txpower === 1000 || txpower === 750 || txpower === 500 || txpower === 250 || txpower === 125 || txpower === 0) {
                d(txpower_id).val(txpower);
            } else {
                d(txpower_id).val(1000);
            }

            d('.country_change').val(m.country || "CN");

            i.append_channel(m.country, m.channel, m.flag, m.htmode, 0, 1);
            i.append_htmode(m.htmode, m.flag);

            g.swich(shortgi_id, String(m.shortgi) || 1, 1);

            d.each(m.wifis, function (x, y) {
                if (x < m.wifis.length - 1) {
                    if (y.ssid == "") return true;
                    wifi_list_id = 'wifi_' + m.flag + '_' + x;
                    ssid_id = 'ssid_' + m.flag + '_' + x;
                    passwd_id = 'passwd_' + m.flag + '_' + x;
                    encrypt_id = 'encrypt_' + m.flag + '_' + x;
                    vlan_id = 'vid_' + m.flag + '_' + x;

                    handle_html = buildhandlehtml(x, m.flag);
                    this_html = buildlisthtml(wifi_list_id, ssid_id, passwd_id, encrypt_id, vlan_id, handle_html);
                    d('#wifilist_' + m.flag).append(this_html);

                    d('#' + ssid_id).val(y.ssid);
                    d('#' + encrypt_id).val(y.encryp_way || 'none');
                    if (y.encryp_way == 'none') {
                        d('#' + passwd_id).attr('disabled', true).val('');
                    } else {
                        d('#' + passwd_id).val(y.key);
                    }

                    d("#" + vlan_id).val(y.vid || "1");
                    if (x == 0) {
                        g.swich(disabled_id, y.disabled, 0);
                    }

                } else {
                    disabled_mgnt = '#switch_wireless_mgnt_' + m.flag;
                    hidessid_mgnt = '#switch_hidessid_mgnt_' + m.flag;
                    ssid_mgnt = '#ssid_mgnt_' + m.flag;
                    encry_mgnt = '#encry_mgnt_' + m.flag;
                    key_mgnt = '#key_mgnt_' + m.flag;

                    d(ssid_mgnt).val(y.ssid);
                    d(encry_mgnt).val(y.encryp_way);
                    if (y.encryp_way == "none") {
                        d(key_mgnt).attr('disabled', true)
                    } else {
                        d(key_mgnt).val(y.key).attr('disabled', false);
                    }
                    g.swich(disabled_mgnt, y.disabled, 0);
                    g.swich(hidessid_mgnt, 1, 1);
                }
            });
        });

        //save
        var arg;

        if (lock_web) {
            return;
        }
        lock_web = true;
        if (arg = volid_wire()) {
            set_apconfig(arg);
        } else {
            lock_web = false;
        }

    }

    //save all
    function SaveAllDescriptions() {
        var arg = {};
        arg.config_ap = [];

        var input_descriptions = d('#manage_tbody .input_description');
        d('#manage_tbody .input_description').each(function(){
            var evt = d(this);    
            clear_all();
            var new_alias = evt.val();
            var num = evt.parents('tr').find('.ap_list_num').html();
            //ap_config_show(array_num);

            one_device = aplist[num];
            var wifi_list_id, ssid_id, passwd_id, vlan_id, disabled_id;
            var hwmode_id, htmode_id, shortgi_id, txpower_id, txpower, encrypt_id;
            var disabled_mgnt, hidessid_mgnt, ssid_mgnt, encry_mgnt, key_mgnt;
            var radio_sum = one_device.radio.length;

            if (radio_sum && radio_sum < 2) {
                show_div_box(one_device);
            } else {
                d('[id^=tab_nav_]').removeClass('hide');
            }

            d('#wifitab>li').each(function (n, m) {
                if (!d(m).hasClass('hide')) {
                    d(m).click();
                    return false;
                }
            });

            ceartrwinfo(one_device);

            g.swich('#switch_hidessid_24g', one_device.wlan_hidden_24g);
            g.swich('#switch_hidessid_58g', one_device.wlan_hidden_5g);

            one_device.alias = new_alias;

            d('#rename_alias').val(one_device.alias);
            d('#wlan_beacon_int').val(one_device.wlan_beacon_int || 100);
            d('#radio_rts').val(one_device.radio_rts || 2347);
            d('#wlan_dtim_period').val(one_device.wlan_dtim_period || 2);
            d('#maxassoc_24g').val(one_device.wlan_maxassoc_24g);
            d('#maxassoc_58g').val(one_device.wlan_maxassoc_5g);
            g.swich('#switch_isolate', one_device.wlan_isolate || 0, 1);

            d("#kickout_check_period").val(one_device.kickout_check_period);
            d("#kickout_kickout_period").val(one_device.kickout_kickout_period / 60);
            d("#kickout_signal_flag").val(one_device.kickout_signal_flag);
            g.swich('#switch_wlroam', one_device.kickout_disable, 0);

            if (one_device.timing_weeks != undefined) {
                var timing_weeks = one_device.timing_weeks;

                if (timing_weeks != '') {
                    checked_week(timing_weeks.split(','));
                }

                d('#times_0').val(one_device.timing_time);
                g.swich('#reboot_switch', one_device.timing_enable);
                if (one_device.timing_enable == '1') {
                    d('#workdays').removeClass('hidden');
                    d('#times_0').attr('disabled', false);
                } else {
                    d('#workdays').addClass('hidden');
                    d('#times_0').attr('disabled', true);
                }

                g.swich('#interval_enable', one_device.interval_enable);
                if (one_device.interval_enable == '1') {
                    d('#interval_time_box').removeClass('hidden');
                    d('#interval_redial_time').attr('disabled', false);
                } else {
                    d('#interval_time_box').addClass('hidden');
                    d('#interval_redial_time').attr('disabled', true);
                }
                d('#interval_redial_time').val(one_device.interval_time);
            }


            d.each(one_radio_wifi, function (n, m) {
                var handle_html, this_html;

                hwmode_id = '#hwmode_' + m.flag;
                txpower_id = '#txpower_' + m.flag;
                disabled_id = '#switch_wireless_' + m.flag;
                htmode_id = '#htmode_' + m.flag;
                shortgi_id = '#short_gi_' + m.flag;

                d(htmode_id).val(m.htmode);

                if (m.flag == '24g') {
                    d(hwmode_id).val(m.hwmode)
                }

                txpower = m.txpower_level;
                if (txpower === 1000 || txpower === 750 || txpower === 500 || txpower === 250 || txpower === 125 || txpower === 0) {
                    d(txpower_id).val(txpower);
                } else {
                    d(txpower_id).val(1000);
                }

                d('.country_change').val(m.country || "CN");

                i.append_channel(m.country, m.channel, m.flag, m.htmode, 0, 1);
                i.append_htmode(m.htmode, m.flag);

                g.swich(shortgi_id, String(m.shortgi) || 1, 1);

                d.each(m.wifis, function (x, y) {
                    if (x < m.wifis.length - 1) {
                        if (y.ssid == "") return true;
                        wifi_list_id = 'wifi_' + m.flag + '_' + x;
                        ssid_id = 'ssid_' + m.flag + '_' + x;
                        passwd_id = 'passwd_' + m.flag + '_' + x;
                        encrypt_id = 'encrypt_' + m.flag + '_' + x;
                        vlan_id = 'vid_' + m.flag + '_' + x;

                        handle_html = buildhandlehtml(x, m.flag);
                        this_html = buildlisthtml(wifi_list_id, ssid_id, passwd_id, encrypt_id, vlan_id, handle_html);
                        d('#wifilist_' + m.flag).append(this_html);

                        d('#' + ssid_id).val(y.ssid);
                        d('#' + encrypt_id).val(y.encryp_way || 'none');
                        if (y.encryp_way == 'none') {
                            d('#' + passwd_id).attr('disabled', true).val('');
                        } else {
                            d('#' + passwd_id).val(y.key);
                        }

                        d("#" + vlan_id).val(y.vid || "1");
                        if (x == 0) {
                            g.swich(disabled_id, y.disabled, 0);
                        }

                    } else {
                        disabled_mgnt = '#switch_wireless_mgnt_' + m.flag;
                        hidessid_mgnt = '#switch_hidessid_mgnt_' + m.flag;
                        ssid_mgnt = '#ssid_mgnt_' + m.flag;
                        encry_mgnt = '#encry_mgnt_' + m.flag;
                        key_mgnt = '#key_mgnt_' + m.flag;

                        d(ssid_mgnt).val(y.ssid);
                        d(encry_mgnt).val(y.encryp_way);
                        if (y.encryp_way == "none") {
                            d(key_mgnt).attr('disabled', true)
                        } else {
                            d(key_mgnt).val(y.key).attr('disabled', false);
                        }
                        g.swich(disabled_mgnt, y.disabled, 0);
                        g.swich(hidessid_mgnt, 1, 1);
                    }
                });
            });

            //save
            var oThis, listsinfo, listlength, hidden, disabled, encryp_way, ssid_value, psk_value, vid_value, radio_config = [], wifi_array = [];

            var week_arr = [];

            var error_flag = 0;
            d.each(one_radio_wifi, function (n, m) {
            
                var channels_val = d('#channels_' + m.flag).val();
                if (channels_val == 'auto') {
                    channels_val = 0;
                }

                var only_radio_wifi = [];
                radio_config[n] = {};

                radio_config[n].phyname = m.radio;
                radio_config[n].htmode = d('#htmode_' + m.flag).val();
                radio_config[n].country = d('.country_change').val();
                radio_config[n].channel = m.chnnel;
                radio_config[n].txpower_level = parseInt(d('#txpower_' + m.flag).val());
                radio_config[n].shortgi = parseInt(d('#short_gi_' + m.flag).attr('data-value'));
                radio_config[n].is_5g = m.is_5g;

                delete(radio_config[n].txPower);

                disabled = d('#switch_wireless_' + m.flag).attr('data-value');
                /*get wifi_config*/
                listsinfo = d("[id^='wifi_" + m.flag + "_']");
                listlength = listsinfo.length;
                for (var i = 0; i < listlength; i++) {
                    oThis = d(listsinfo[i]);
                    ssid_value = oThis.find('[id^="ssid_' + m.flag + '_"]').val();
                    encryp_way = oThis.find('[id^="encrypt_' + m.flag + '_"]').val();
                    psk_value = oThis.find('[id^="passwd_' + m.flag + '_"]').val();

                    if (encryp_way == "psk2") {
                        if (psk_value.length < 8 || psk_value.length > 32) {
                            error_flag = 1;
                            return false;
                        }
                    }
                    vid_value = oThis.find('[id^="vid_' + m.flag + '_"]').val();
                    only_radio_wifi[i] = new_iface(disabled, ssid_value, encryp_way, psk_value, 8 * n + i, m.flag, vid_value);
                }

                disabled = d('#switch_wireless_mgnt_' + m.flag).attr('data-value');
                encryp_way = d('#encry_mgnt_' + m.flag).val();
                psk_value = d('#key_mgnt_' + m.flag).val();

                if (encryp_way == "psk2") {
                    if (psk_value.length < 8 || psk_value.length > 32) {
                        error_flag = 1;
                        return false;
                    }
                }

                ssid_value = d('#ssid_mgnt_' + m.flag).val();
                hidden = d('#switch_hidessid_mgnt_' + m.flag).attr('data-value');

                var mgnt_flag;
                if (m.flag == '24g') {
                    mgnt_flag = '2g'
                } else {
                    mgnt_flag = '5g'
                }
                only_radio_wifi.push(manager_iface(disabled, ssid_value, encryp_way, psk_value, '_admin_' + mgnt_flag, m.flag));
                //m.wifis[m.wifis.length - 1] = manager_iface(n, d('#ssid_manger_' + m.flag).val(), d('#passwd_manger_' + m.flag).val(), '_admin_' + adminflag);
                d.each(only_radio_wifi, function (x, y) {
                    wifi_array.push(y);
                })
            });

            if (error_flag) {
                h.ErrorTip(tip_num++, key_length_note);
                return;
            }

            d.each(weeks_num, function (x, y) {
                var week_id = "#weeks_0_" + y;
                if (d(week_id).prop("checked") == true) {
                    week_arr.push(y)
                }
            });

            var _dev_config = {};

            _dev_config.timing_enable = d('#reboot_switch').attr('data-value');
            _dev_config.timing_weeks = week_arr.join(',');
            _dev_config.timing_time = d('#times_0').val();
            _dev_config.interval_enable = d('#interval_enable').attr('data-value');
            _dev_config.interval_time = d('#interval_redial_time').val();

            _dev_config.device_mac = one_device.mac;
            _dev_config.alias = d('#rename_alias').val();
            _dev_config.wlan_hidden_24g = parseInt(d('#switch_hidessid_24g').attr('data-value')) || 0;
            _dev_config.wlan_hidden_5g = parseInt(d('#switch_hidessid_58g').attr('data-value') || 0);
            _dev_config.wlan_maxassoc_24g = parseInt(d('#maxassoc_24g').val());
            _dev_config.wlan_maxassoc_5g = parseInt(d('#maxassoc_58g').val());
            _dev_config.wlan_beacon_int = parseInt(d('#wlan_beacon_int').val());
            _dev_config.wlan_dtim_period = parseInt(d('#wlan_dtim_period').val());
            _dev_config.wlan_isolate = parseInt(d('#switch_isolate').attr('data-value'));
            _dev_config.radio_rts = parseInt(d("#radio_rts").val());
            _dev_config.radio = radio_config;
            _dev_config.vif = wifi_array;
            _dev_config.kickout_disable = parseInt(d('#switch_wlroam').attr('data-value'));
            _dev_config.kickout_check_period = parseInt(d("#kickout_check_period").val());
            _dev_config.kickout_kickout_period = d("#kickout_kickout_period").val() * 60;
            _dev_config.kickout_signal_flag = parseInt(d("#kickout_signal_flag").val());
            arg.config_ap.push(_dev_config);
            
        });
        

        if (lock_web) {
            return;
        }
        lock_web = true;
        set_apconfig(arg);
        //lock_web = false;
    }

    function clear_all() {
        d('[id^=wifilist_]').html('');
    }

    function ap_config_show(num) {
        d('.require').unbind('blur');
        one_device = aplist[num];
        var wifi_list_id, ssid_id, passwd_id, vlan_id, disabled_id;
        var hwmode_id, htmode_id, shortgi_id, txpower_id, txpower, encrypt_id;
        var disabled_mgnt, hidessid_mgnt, ssid_mgnt, encry_mgnt, key_mgnt;
        var radio_sum = one_device.radio.length;

        if (radio_sum && radio_sum < 2) {
            show_div_box(one_device);
        } else {
            d('[id^=tab_nav_]').removeClass('hide');
        }

        d('#wifitab>li').each(function (n, m) {
            if (!d(m).hasClass('hide')) {
                d(m).click();
                return false;
            }
        });

        ceartrwinfo(one_device);

        g.swich('#switch_hidessid_24g', one_device.wlan_hidden_24g);
        g.swich('#switch_hidessid_58g', one_device.wlan_hidden_5g);

        d('#rename_alias').val(one_device.alias);
        d('#wlan_beacon_int').val(one_device.wlan_beacon_int || 100);
        d('#radio_rts').val(one_device.radio_rts || 2347);
        d('#wlan_dtim_period').val(one_device.wlan_dtim_period || 2);
        d('#maxassoc_24g').val(one_device.wlan_maxassoc_24g);
        d('#maxassoc_58g').val(one_device.wlan_maxassoc_5g);
        g.swich('#switch_isolate', one_device.wlan_isolate || 0, 1);

        d("#kickout_check_period").val(one_device.kickout_check_period);
        d("#kickout_kickout_period").val(one_device.kickout_kickout_period / 60);
        d("#kickout_signal_flag").val(one_device.kickout_signal_flag);
        g.swich('#switch_wlroam', one_device.kickout_disable, 0);

        if (one_device.timing_weeks != undefined) {
            var timing_weeks = one_device.timing_weeks;

            if (timing_weeks != '') {
                checked_week(timing_weeks.split(','));
            }

            d('#times_0').val(one_device.timing_time);
            g.swich('#reboot_switch', one_device.timing_enable);
            if (one_device.timing_enable == '1') {
                d('#workdays').removeClass('hidden');
                d('#times_0').attr('disabled', false);
            } else {
                d('#workdays').addClass('hidden');
                d('#times_0').attr('disabled', true);
            }

            g.swich('#interval_enable', one_device.interval_enable);
            if (one_device.interval_enable == '1') {
                d('#interval_time_box').removeClass('hidden');
                d('#interval_redial_time').attr('disabled', false);
            } else {
                d('#interval_time_box').addClass('hidden');
                d('#interval_redial_time').attr('disabled', true);
            }
            d('#interval_redial_time').val(one_device.interval_time);
        }


        d.each(one_radio_wifi, function (n, m) {
            var handle_html, this_html;

            hwmode_id = '#hwmode_' + m.flag;
            txpower_id = '#txpower_' + m.flag;
            disabled_id = '#switch_wireless_' + m.flag;
            htmode_id = '#htmode_' + m.flag;
            shortgi_id = '#short_gi_' + m.flag;

            d(htmode_id).val(m.htmode);

            if (m.flag == '24g') {
                d(hwmode_id).val(m.hwmode)
            }

            txpower = m.txpower_level;
            if (txpower === 1000 || txpower === 750 || txpower === 500 || txpower === 250 || txpower === 125 || txpower === 0) {
                d(txpower_id).val(txpower);
            } else {
                d(txpower_id).val(1000);
            }

            d('.country_change').val(m.country || "CN");

            i.append_channel(m.country, m.channel, m.flag, m.htmode, 0, 1);
            i.append_htmode(m.htmode, m.flag);

            g.swich(shortgi_id, String(m.shortgi) || 1, 1);

            d.each(m.wifis, function (x, y) {
                if (x < m.wifis.length - 1) {
                    if (y.ssid == "") return true;
                    wifi_list_id = 'wifi_' + m.flag + '_' + x;
                    ssid_id = 'ssid_' + m.flag + '_' + x;
                    passwd_id = 'passwd_' + m.flag + '_' + x;
                    encrypt_id = 'encrypt_' + m.flag + '_' + x;
                    vlan_id = 'vid_' + m.flag + '_' + x;

                    handle_html = buildhandlehtml(x, m.flag);
                    this_html = buildlisthtml(wifi_list_id, ssid_id, passwd_id, encrypt_id, vlan_id, handle_html);
                    d('#wifilist_' + m.flag).append(this_html);

                    d('#' + ssid_id).val(y.ssid);
                    d('#' + encrypt_id).val(y.encryp_way || 'none');
                    if (y.encryp_way == 'none') {
                        d('#' + passwd_id).attr('disabled', true).val('');
                    } else {
                        d('#' + passwd_id).val(y.key);
                    }

                    d("#" + vlan_id).val(y.vid || "1");
                    if (x == 0) {
                        g.swich(disabled_id, y.disabled, 0);
                    }

                } else {
                    disabled_mgnt = '#switch_wireless_mgnt_' + m.flag;
                    hidessid_mgnt = '#switch_hidessid_mgnt_' + m.flag;
                    ssid_mgnt = '#ssid_mgnt_' + m.flag;
                    encry_mgnt = '#encry_mgnt_' + m.flag;
                    key_mgnt = '#key_mgnt_' + m.flag;

                    d(ssid_mgnt).val(y.ssid);
                    d(encry_mgnt).val(y.encryp_way);
                    if (y.encryp_way == "none") {
                        d(key_mgnt).attr('disabled', true)
                    } else {
                        d(key_mgnt).val(y.key).attr('disabled', false);
                    }
                    g.swich(disabled_mgnt, y.disabled, 0);
                    g.swich(hidessid_mgnt, 1, 1);
                }
            });
        });
        h.volide('body');
    }

    et.changeTab = function(evt){
        var val = evt.attr('data-value');
        var id = evt.attr('id');
        if(id == 'btnShow24')
        {
            //if(val == 0)
            {
                b_show_24 = 1;
                evt.addClass('active');
                d('#btnShow58').removeClass('active');
                evt.attr('data-value', 1);
                d('#btnShow58').attr('data-value', 0);
            }
            /*
            else 
            {
                b_show_24 = 0;
                evt.removeClass('active');
                d('#btnShow58').addClass('active');
                evt.attr('data-value', 0);
                d('#btnShow58').attr('data-value', 1);
            }*/

        }
        else
        {
            //if(val == 0)
            {
                b_show_24 = 0;
                d('#btnShow58').addClass('active');
                d('#btnShow24').removeClass('active');
                evt.attr('data-value', 1);            
                d('#btnShow24').attr('data-value', 0);

            }
            /*
            else
            {
                b_show_24 = 1;
                d('#btnShow58').removeClass('active');
                d('#btnShow24').addClass('active');
                evt.attr('data-value', 0);
                d('#btnShow24').attr('data-value', 1);
            }
            */
        }
        d.cookie('b_show_24', b_show_24);
        refresh_init();
    }

    function checked_week(weeks) {
        d.each(weeks, function (n, m) {
            d('#weeks_0_' + m).prop('checked', true).attr('data-value', '1');
        })
        if (d('.week_0').length == d('.week_0:checked').length) {
            d('#weeks_all_0').prop('checked', true).attr('data-value', '1');
        }
    }

    function buildhandlehtml(i, rflag) {
        if (i == 0) {
            return '<td><a class="table-link" data-value="' + rflag + '" et="click tap:wifi_add"><span class="fa-stack"><i class="fa fa-plus-square-o fa-stack-2x"></i><i></i></span></a></td>';
        } else {
            return '<td><a class="table-link" et="click tap:wifi_del"><span class="fa-stack"><i class="fa fa-minus-square-o fa-stack-2x"></i><i></i></span></a></td>';
        }
    }

    function buildlisthtml(wifi_list_id, ssid_id, passwd_id, encrypt_id, vlan_id, handle_html) {
        return '<tr class="text-center" id ="' + wifi_list_id + '">' +
            '<td class="form_right"><span class="tip_name hide" sh_lang="name_or_ssid">' + name_or_ssid + '</span><input maxlength="32" autocomplete="off" class="form-control require isSSID" type="text" id="' + ssid_id + '"></td>' +
            '<td><select class="form-control" id="' + encrypt_id + '" et="change:changeencrypt"><option value="psk2" selected="selected" >wpa2-psk</option><option value="none">none</option><option value="psk">psk</option><option value="psk-mixed+tkip+ccmp">psk-mixed+tkip+ccmp</option></td>' +
            '<td class="form_right"><span class="tip_name hide" sh_lang="ddns_passwd">' + ddns_passwd + '</span><input maxlength="32" autocomplete="off" type="text" class="form-control require isSSIDPwd" id="' + passwd_id + '"></td>' +
            '<td class="form_right"><select class="form-control" id="' + vlan_id + '">' + vlan_option() + '</select></td>' + handle_html;

    }

    function vlan_option(vlan_id) {
        var this_html = '';
        if (vlan_id == "1" || vlan_id == "") {
            this_html = '<option value="1" selected>' + ssid_vlan_disabled + '</option>';
        } else {
            this_html = '<option value="1">' + ssid_vlan_disabled + '</option>';
        }

        d.each(vlan_list, function (n, m) {
            //if (vlan_id == m.id) {
            //    this_html += '<option value="' + m.id + '" selected>' + m.iface.toUpperCase() + '</option>';
            //} else {
            this_html += '<option value="' + m.id + '">' + m.iface.toUpperCase() + '</option>';
            //}

        });
        return this_html;
    }

    function get_vlan_name(vlan_id){
        var vlan_name = "Disabled";
        d.each(vlan_config, function (n, m){
            if(m.id == vlan_id)
            {
                vlan_name = m.desc;
                if(vlan_name == "")
                    vlan_name = m.iface.toUpperCase();

                return false;
            }
        });

        return vlan_name;
    }
 

    function get_group_vlan_name(group_id, _b_show_24, is_td) {
        var vlan_name = "Disabled";
        var vlan_id = 0;
        var group_name = "";
        var vlan_list = [];

        d.each(group_obj, function(n,m){
            if(m.group_id != group_id) return;

            group_name = m.group_name;

            d.each(m.vif, function(vid_idx, vid_info){
                if(vid_info.name.toLowerCase().indexOf("admin") >= 0)
                    return;

                if(b_show_24 == 1 && vid_info.is_5g == 1) return;
                if(b_show_24 == 0 && vid_info.is_5g == 0) return;
                
                var vlan_data = {ssid:vid_info.ssid, vid:vid_info.vid};
                vlan_list.push(vlan_data);
            });
        });

        if(is_td)
        {
            if(vlan_list.length > 1)
            {
                vlan_name = "Multiple VLANs";
            }
            else
            {
                vlan_name = get_vlan_name(vlan_list[0].vid);
            }
            return vlan_name;
        }


        if(vlan_list.length > 1)
        {
            
           vlan_name = '<table class="table-tooltip table"><thead><tr><th class="text-left" style="min-width:100px">SSID</th><th class="text-left" style="min-width:100px">VLAN Name</th></tr></thead><tbody id="multivlans">';
           d.each(vlan_list, function(n, m){
               if(n == vlan_list.length - 1)
                 vlan_name += '<tr><td class="text-left no-border">' + m.ssid + '</td><td class="text-left">' + get_vlan_name(m.vid) + '</td></tr>';
               else 
                   vlan_name += '<tr><td class="text-left">' + m.ssid + '</td><td class="text-left">' + get_vlan_name(m.vid) + '</td></tr>';
            });
       

           vlan_name += `</tbody></table>`;
        }
        else
        {
            vlan_name = "";
        }
        return vlan_name;
    }

    et.ApplySetting = function(evt){
        long_save = true;
        refresh_after_save = false;

        run_waitMe('progress');
        SaveAllDescriptions();
        //setTimeout(stop_waitMe, 60000);
        d('#btnApplySetting').removeClass('active');
    }

  
    //add wifilist
    et.wifi_add = function (evt) {
        d('.require').unbind('blur');
        var rflag, n, uid, obj;
        rflag = evt.attr('data-value');
        uid = 'wifilist_' + rflag;
        obj = d('#' + uid).children();

        if (!wifi_langht) {
            wifi_langht = obj.length + 1;
        }

        n = obj.length + 1;
        if (n > wilrmaxnum) {
            h.volide('body');
            return;
        }
        var $html = wifihtml(rflag, wifi_langht);
        wifi_langht++;
        n++;
        d('#' + uid).append($html);
        h.volide('body');
    };

    function wifihtml(n, i) {
        var this_html = '';
        this_html += '<tr class="text-center" id="wifi_' + n + '_' + i + '">';
        this_html += '<td class="form_right"><span class="tip_name hide" sh_lang="name_or_ssid">' + name_or_ssid + '</span><input type="text" autocomplete="off" id="ssid_' + n + '_' + i + '" maxlength="32" class="form-control require isSSID"></td>';
        this_html += '<td><select id="encrypt_' + n + '_' + i + '" class="form-control" et="change:changeencrypt"><option value="none" selected="selected">none</option><option value="psk2">wpa2-psk</option><option value="psk">psk</option><option value="psk-mixed+tkip+ccmp">psk-mixed+tkip+ccmp</option></select></td>';
        this_html += '<td class="form_right"><span class="tip_name hide" sh_lang="ddns_passwd">' + ddns_passwd + '</span><input type="text" id="passwd_' + n + '_' + i + '" disabled="disabled" class="form-control require notip isSSIDPwd"></td>';
        this_html += '<td class="form_right"><select  class="form-control" id="vid_' + n + '_' + i + '">' + vlan_option(1) + '</select></td>';
        this_html += '<td><a class="table-link" et="click tap:wifi_del"><span class="fa-stack"><i class="fa fa-minus-square-o fa-stack-2x"></i></span></a></td>';
        this_html += '</tr>';
        return this_html;
    }

    //del wifilist
    et.wifi_del = function (evt) {
        evt.parents('tr').remove();
    };

    function show_div_box(one_device) {
        var hide_radio;
        if (one_device.radio[0].is_5g == 0) {
            hide_radio = '58g';
        } else if (one_device.radio[0].is_5g == 1) {
            hide_radio = '24g';
        }
        d('#tab_nav_' + hide_radio).addClass('hide');
    }

    function ceartrwinfo(one_device) {
        var tmp_num, dub_radio;
        dub_radio = one_device.radio.length;
        one_radio_wifi = [];
        d.each(one_device.radio, function (n, m) {
            if (m.hwmode.indexOf('a') < 0) {
                tmp_num = 0;
                one_radio_wifi[tmp_num] = m;
                one_radio_wifi[tmp_num].flag = '24g';
                one_radio_wifi[tmp_num].is_5g = 0;
                one_radio_wifi[tmp_num].radio = 'radio0'
            } else if (m.hwmode.indexOf('a') > -1) {
                if (dub_radio == 1) {
                    tmp_num = 0;
                } else if (dub_radio == 2) {
                    tmp_num = 1;
                }
                one_radio_wifi[tmp_num] = m;
                one_radio_wifi[tmp_num].flag = '58g';
                one_radio_wifi[tmp_num].is_5g = 1;
                one_radio_wifi[tmp_num].radio = 'radio1'
            }

            one_radio_wifi[tmp_num].wifis = [];
            d.each(one_device.vif, function (x, y) {
                if (m.is_5g == y.is_5g) {
                    one_radio_wifi[tmp_num].wifis.push(y);
                }
            });
        });
    }

    et.close_glim = function () {
        volid_glim(0);
    };

    et.open_glim = function () {
        volid_glim(1);
    };

    function volid_glim(status) {
        var a = {}, arg = [], arg_array = [];
        var this_checked = d('#manage_tbody').find('input:checked');


        if (this_checked.length < 1) {
            return;
        }

        if (status == '1') {
            a.led_action = 'on';
        } else {
            a.led_action = 'off';
        }

        this_checked.each(function (n, m) {
            arg = {};
            arg.device_mac = d(m).parents('tr').find('.apmac').text().toLowerCase();
            arg_array.push(arg);
        });

        a.led_ap_member = arg_array;
        set_ledglim(a);
    }

    et.delap = function (evt) {
        var arg;
        if (lock_web) {
            return;
        }
        lock_web = true;
        if (arg = volid_delap(evt)) {
            d('.closewin').click();
            set_delap(arg);
        } else {
            lock_web = false;
        }
    };

    function volid_delap(evt) {
        var a = {}, b = [];
        b[0] = {};
        b[0].mac = evt.parents('tr').find('.apmac').text().toLowerCase();
        a.maclist = b;
        return a;
    }

    et.changestatus = function (evt) {
        var swich_status = evt.attr('data-value');
        var swich_defaut = evt.attr('data-default');
        if (swich_status == 1) {
            swich_status = 0;
        } else {
            swich_status = 1;
        }
        g.swich(evt, swich_status, swich_defaut);
    };

    et.change_htmode = function (evt) {
        var htmode_val = d(evt).val();
        var country_val = d('.country_change').val();
        i.append_channel(country_val, "0", '58g', htmode_val, 0, 1);
    };

    et.change_country = function (evt) {
        var country_val = d(evt).val();
        d('.country_change').val(country_val);

        d.each(one_radio_wifi, function (n, m) {
            i.append_channel(country_val, "0", m.flag, d('#htmode_' + m.flag).val(), 0, 1);
        })
    };

    et.changeencrypt = function (evt) {
        var evt_change = d(evt).val();
        var evt_pwd = evt.parents('tr').find('input[class*="isSSIDPwd"]');
        if (evt_change == "none") {
            evt_pwd.attr('disabled', true).removeClass('borError');
        } else {
            evt_pwd.attr('disabled', false);
        }
    };

    et.mgntencrychange = function (evt) {
        var radio_flag = evt.attr('data-value');
        var encry = evt.val();
        if (encry == 'none' || encry == '') {
            d('#key_mgnt_' + radio_flag).attr('disabled', true);
        } else {
            d('#key_mgnt_' + radio_flag).attr('disabled', false);
        }
    };

    et.reboot_status = function (evt) {
        if (d(evt).attr("data-value") == undefined && !d(evt).hasClass('switch_ext')) {
            evt = d(evt).parent();
        }
        var swich_status = evt.attr('data-value');
        var swich_defaut = evt.attr('data-default') || 1;
        if (swich_status == 1) {
            swich_status = 0;
        } else {
            swich_status = 1;
        }
        g.swich(evt, swich_status, swich_defaut);

        if (d(evt).attr('id') == 'interval_enable') {
            if (swich_status == swich_defaut) {
                d('#interval_time_box').removeClass('hidden');
                d('#interval_redial_time').attr('disabled', false);
            } else {
                d('#interval_time_box').addClass('hidden');
                d('#interval_redial_time').attr('disabled', true);
            }
        }

        if (d(evt).attr('id') == 'reboot_switch') {
            if (swich_status == swich_defaut) {
                d('#workdays').removeClass('hidden');
                d('#times_0').attr('disabled', false)
            } else {
                d('#workdays').addClass('hidden');
                d('#times_0').attr('disabled', true)
            }
        }
    };

    et.select_all_week = function (evt) {
        if (d(evt).attr('data-value') == '0') {
            d(evt).prop('checked', true).attr('data-value', '1');
            d('.week_0').prop('checked', true).attr('data-value', '1');
        } else if (d(evt).attr('data-value') == '1') {
            d(evt).prop('checked', false).attr('data-value', '0');
            d('.week_0').prop('checked', false).attr('data-value', '0');
        }
    };

    et.select_one_week = function (evt) {
        var weekcheck = d(evt).attr('data-value');
        if (weekcheck == '1') {
            d(evt).prop('checked', false).attr('data-value', '0');
            d('#weeks_all_0').prop('checked', false).attr('data-value', '0');
        } else {
            d(evt).prop('checked', true).attr('data-value', '1');
        }

        if (d('.week_0').length == d('.week_0:checked').length) {
            d('#weeks_all_0').prop('checked', true).attr('data-value', '1');
        }
    };

    et.rebootap = function () {
        var this_checked = d('#manage_tbody').find('input:checked');
        var arg, arg_array = [], reboot_mac = {};

        if (this_checked.length < 1) {
            return;
        }
        this_checked.each(function (n, m) {
            arg = {};
            arg.device_mac = d(m).parents('tr').find('.apmac').text().toLowerCase();
            arg_array.push(arg);
        });

        reboot_mac.reboot_ap_member = arg_array;
        reboot_ap_list(reboot_mac);
    };

    et.saveConfig = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg;

        if (lock_web) {
            return;
        }
        lock_web = true;
        if (arg = volid_wire()) {
            d('.closewin').click();
            set_apconfig(arg);
        } else {
            lock_web = false;
        }
    };



    function volid_wire() {
        var oThis, listsinfo, listlength, hidden, disabled, encryp_way, ssid_value, psk_value, vid_value, radio_config = [], wifi_array = [], config = {};

        var week_arr = [];

        var error_flag = 0;
        d.each(one_radio_wifi, function (n, m) {
           
            var channels_val = d('#channels_' + m.flag).val();
            if (channels_val == 'auto') {
                channels_val = 0;
            }

            var only_radio_wifi = [];
            radio_config[n] = {};

            radio_config[n].phyname = m.radio;
            radio_config[n].htmode = d('#htmode_' + m.flag).val();
            radio_config[n].country = d('.country_change').val();
            radio_config[n].channel = m.chnnel;
            radio_config[n].txpower_level = parseInt(d('#txpower_' + m.flag).val());
            radio_config[n].shortgi = parseInt(d('#short_gi_' + m.flag).attr('data-value'));
            radio_config[n].is_5g = m.is_5g;

            delete(radio_config[n].txPower);

            disabled = d('#switch_wireless_' + m.flag).attr('data-value');
            /*get wifi_config*/
            listsinfo = d("[id^='wifi_" + m.flag + "_']");
            listlength = listsinfo.length;
            for (var i = 0; i < listlength; i++) {
                oThis = d(listsinfo[i]);
                ssid_value = oThis.find('[id^="ssid_' + m.flag + '_"]').val();
                encryp_way = oThis.find('[id^="encrypt_' + m.flag + '_"]').val();
                psk_value = oThis.find('[id^="passwd_' + m.flag + '_"]').val();

                if (encryp_way == "psk2") {
                    if (psk_value.length < 8 || psk_value.length > 32) {
                        error_flag = 1;
                        return false;
                    }
                }
                vid_value = oThis.find('[id^="vid_' + m.flag + '_"]').val();
                only_radio_wifi[i] = new_iface(disabled, ssid_value, encryp_way, psk_value, 8 * n + i, m.flag, vid_value);
            }

            disabled = d('#switch_wireless_mgnt_' + m.flag).attr('data-value');
            encryp_way = d('#encry_mgnt_' + m.flag).val();
            psk_value = d('#key_mgnt_' + m.flag).val();

            if (encryp_way == "psk2") {
                if (psk_value.length < 8 || psk_value.length > 32) {
                    error_flag = 1;
                    return false;
                }
            }

            ssid_value = d('#ssid_mgnt_' + m.flag).val();
            hidden = d('#switch_hidessid_mgnt_' + m.flag).attr('data-value');

            var mgnt_flag;
            if (m.flag == '24g') {
                mgnt_flag = '2g'
            } else {
                mgnt_flag = '5g'
            }
            only_radio_wifi.push(manager_iface(disabled, ssid_value, encryp_way, psk_value, '_admin_' + mgnt_flag, m.flag));
            //m.wifis[m.wifis.length - 1] = manager_iface(n, d('#ssid_manger_' + m.flag).val(), d('#passwd_manger_' + m.flag).val(), '_admin_' + adminflag);
            d.each(only_radio_wifi, function (x, y) {
                wifi_array.push(y);
            })
        });

        if (error_flag) {
            h.ErrorTip(tip_num++, key_length_note);
            return;
        }

        d.each(weeks_num, function (x, y) {
            var week_id = "#weeks_0_" + y;
            if (d(week_id).prop("checked") == true) {
                week_arr.push(y)
            }
        });

        dev_config.timing_enable = d('#reboot_switch').attr('data-value');
        dev_config.timing_weeks = week_arr.join(',');
        dev_config.timing_time = d('#times_0').val();
        dev_config.interval_enable = d('#interval_enable').attr('data-value');
        dev_config.interval_time = d('#interval_redial_time').val();

        dev_config.device_mac = one_device.mac;
        dev_config.alias = d('#rename_alias').val();
        dev_config.wlan_hidden_24g = parseInt(d('#switch_hidessid_24g').attr('data-value')) || 0;
        dev_config.wlan_hidden_5g = parseInt(d('#switch_hidessid_58g').attr('data-value') || 0);
        dev_config.wlan_maxassoc_24g = parseInt(d('#maxassoc_24g').val());
        dev_config.wlan_maxassoc_5g = parseInt(d('#maxassoc_58g').val());
        dev_config.wlan_beacon_int = parseInt(d('#wlan_beacon_int').val());
        dev_config.wlan_dtim_period = parseInt(d('#wlan_dtim_period').val());
        dev_config.wlan_isolate = parseInt(d('#switch_isolate').attr('data-value'));
        dev_config.radio_rts = parseInt(d("#radio_rts").val());
        dev_config.radio = radio_config;
        dev_config.vif = wifi_array;
        dev_config.kickout_disable = parseInt(d('#switch_wlroam').attr('data-value'));
        dev_config.kickout_check_period = parseInt(d("#kickout_check_period").val());
        dev_config.kickout_kickout_period = d("#kickout_kickout_period").val() * 60;
        dev_config.kickout_signal_flag = parseInt(d("#kickout_signal_flag").val());
        config.config_ap = [];
        config.config_ap.push(dev_config);
        return config
    }

    function new_iface(disabled, ssid, encryp, passwd, wlannum, flag, vid) {
        var wlanname = "wlan" + wlannum;
        var iface_config = {};

        iface_config.ssid = ssid;
        iface_config.encryp_way = encryp;
        if (encryp != 'none') {
            iface_config.key = passwd || '';
        }

        iface_config.disabled = parseInt(disabled);
        //iface_config.phyname = radioname;
        iface_config.name = wlanname;

        if (flag == '24g') {
            iface_config.is_5g = 0;
            iface_config.phyname = 'radio0';
        } else {
            iface_config.is_5g = 1;
            iface_config.phyname = 'radio1';
        }
        //iface_config.vid = parseInt(vid);

        return iface_config;
    }

    function manager_iface(radio_num, disabled, ssid, encryp, passwd, wlannum, flag) {
        return new_iface(radio_num, disabled, ssid, encryp, passwd, wlannum, flag);
    }

    function reboot_ap_list(arg) {
        f.setMConfig('ap_reboot_action', arg, function (d) {
            if (d.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000)
            }
        })
    }

    /*??*/
    function set_apconfig(arg) {
        f.setMConfig('ap_detail_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                if(refresh_after_save == true)
                {
                    h.SetOKTip(tip_num++, set_success);
                    refresh_init();
                }
                setTimeout(reset_lock_web, 3000);

                if(long_save == true)
                {
                    run_waitMe('progress');
                    setTimeout(function(){
                        h.SetOKTip(tip_num++, set_success);
                        refresh_init();
                        stop_waitMe();
                    }, 60000);
                }

                refresh_after_save = false;
                long_save = false;
            }
        })
    }

    function set_ledglim(arg) {
        f.setMConfig('ap_led_action', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000)
            }
        })
    }

    function set_delap(arg) {
        f.setMConfig('system_ac_list_del', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000);
                
            }
        })
    }

    function reset_lock_web() {
        lock_web = false;
    }

    function gohref() {
        location.href = location.href;
    }

    
    var progressBarState = 0,
    intervalId = 0,
    progressBarStep = 0;


    function run_waitMe(effect){
        /*
		$('#page-wrapper').waitMe({
			effect: effect,
			text: please_waiting,
			bg: 'rgba(255,255,255,0.7)',
            color:'#000',
            waitTime: 30000
        });
        */
       d('#page-wrapper').addClass('waitMe_container');
       d('.waitMe').removeClass('hide');
       progressBarState = 0;
       progressBarStep = 60000 / 50;
       runProgress();
    }

    function stop_waitMe()
    {
        d('#page-wrapper').removeClass('waitMe_container');
        d('.waitMe').addClass('hide');
        progressBarState = 100;
        refresh_init();
    }

     //run every 1 sec
     function runProgress(){

        progressBarState += 1;
        if(progressBarState > 100) progressBarState = 100;
        var elem = document.getElementById("myBar");
        elem.style.width = progressBarState + "%";
       // elem.innerHTML = "" +  progressBarState + "%";

        if(progressBarState >= 100)
            return;

       intervalId = setTimeout(runProgress, progressBarStep);

    }


    b.init = init;
});
