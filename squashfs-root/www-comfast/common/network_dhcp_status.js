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

    var StaticList, DhcpList, status_array;
    var this_table, lock_web = false, tip_num = 0, default_num = 0;
    var double_support, dev_vlan_type, vlan_config;
    var dhcp_clients = [];
    var lan_list, lanlists_info, vlanlists_info;
    var arp_bind_list;
    
    var selected_vlan = '';
    var search_key = '';
    var b_vlan_selected = false;
    var b_keyword_selected = false;

    function init() {
        d('.select_line').val(default_num);
        e.plugInit(et, start_model);
    }

    function start_model(data) {
		run_waitMe('ios');
		setTimeout(function(){
			device = data;
			refresh_init();
			},0);
    }
    
    function run_waitMe(effect){
		$('#page-wrapper').waitMe({
			effect: effect,
			text: please_waiting,
			bg: 'rgba(255,255,255,0.7)',
			color:'#000'
		});
    }

    //loading finished
    function release_loading(bshowTip)
    {
        $('#page-wrapper').waitMe('hide');
        if(bshowTip)
            h.SetOKTip(tip_num++, set_success);
    }

    function refresh_init() {
        
        f.getSHConfig('bandwidth_config.php?method=GET&action=lan_list', function(data){
            lan_list = data || [];
        },false);


        f.getSHConfig('client_config.php?method=GET&action=client_info', function(data){
            dhcp_clients = data || [];
        },false);

        f.getSHConfig('client_config.php?method=GET&action=client_info2', function(data){
            arpbind_info = data || [];
        },false);



        f.getMConfig('vlan_config', function (data) {
            if (data && data.errCode == 0) {
                double_support = data.double_support;
                dev_vlan_type = data.vlan_itype;
                vlan_config = data.vlan || [];
                showVlanList();
            }
         }, false);

        f.getMConfig('dhcp_static_list', function (data) {
            if (data && data.errCode == 0) {
                StaticList = data.dhcp || [];
            }
        }, false);

        f.getMConfig('dhcp_list', function (data) {
            if (data.errCode == 0) {
                DhcpList = data.dhcp || [];
                refresh_DList();
            }
        }, false);
        
        d('#nav-col').css('opacity', '1');
        d('#content-wrapper').css('opacity', '1');
        release_loading(false);
    }
    
    function showVlanList() {
		
		var txt_html = "";
			var vlan_name = "Default VLAN";
            var vlan_iface = "";
            
            txt_html += '<option value="">ALL</option>';

            d.each(vlan_config, function(vlan_index, vlan_info){
				vlan_name = vlan_info.desc == "" ? vlan_info.iface : vlan_info.desc;
				vlan_iface = vlan_info.iface;
				txt_html += '<option value="' + vlan_iface + '">' + vlan_name + '</option>';
            });

            d.each(lan_list, function(lan_index, lan_info){
				vlan_name = lan_info.hostname == "" ? lan_info.ifname.toUpperCase() : lan_info.hostname;
				vlan_iface = lan_info.ifname.toUpperCase();
				txt_html += '<option value="' + vlan_iface + '">' + vlan_name + '</option>';
            });
            
            d('.select_vlan').html(txt_html);
            
            d('.select_vlan').select(selected_vlan);
            d('.select_vlan').val(selected_vlan);
	
	}

    function refresh_DList() {
        var static_flag;
        status_array = [];
        d.each(DhcpList, function (n, m) {
            static_flag = 0;
            d.each(StaticList, function (x, y) {
                if (m.mac == y.mac) {
                    static_flag = 1;
                    return false;
                }
            });
            if (!static_flag) {
                status_array.push(m);
            }
        });
        showtable();
    }

    function showtable() {
        var this_html = '';

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(status_array, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td class="real_num hidden" >' + m.real_num + '</td>';
            this_html += '<td><input class="row-checkbox" type="checkbox" /></td>';
            this_html += '<td class="text-left">' + (n + 1) + '</td>';
            this_html += '<td class="src_ip text-left">' + m.ip + '</td>';
            this_html += '<td class="src_mac text-left" >' + m.mac.toUpperCase() + '</td>';
            this_html += '<td class="src_name text-left" >' + m.commentname + '</td>';

            var additional_info = {};
            d.each(dhcp_clients, function(client_index, client_info){
                if(client_info.mac.toLowerCase() == m.mac.toLowerCase())
                {
                    additional_info = client_info;
                    return false;
                }
            });

            var arp_data = {};

            d.each(arpbind_info, function(arp_index, arp_info){
                if(m.mac.toLowerCase() == arp_info.mac.toLowerCase())
                {
                    arp_data = arp_info;
                    return false;
                }

            });
            this_html += '<td class="tbl_Description text-left"><span class="hide">' + (arp_data.remark || "") + '</span><input type="text" value="' + (arp_data.remark || "") + '" style="min-width:170px;border:1px solid #ffffff;" id="description_' + n + '" class="input_description border_light_grey" et="blur:changeDescription" /></td>';



            var client_ip = m.ip;
            var dec_ip = IpSubnetCalculator.toDecimal(client_ip);
            var vlan_name = "Default VLAN";
            var vlan_iface = "";
            var vlan_id = 1;

            d.each(vlan_config, function(vlan_index, vlan_info){
                if(vlan_info.ipaddr){
                    var calc_data = IpSubnetCalculator.calculateCIDRPrefix(vlan_info.ipaddr, vlan_info.netmask);
                    if(dec_ip >= calc_data.ipLow && dec_ip <= calc_data.ipHigh)
                    {
                        //this ip is in this vlan_config
                        vlan_name = vlan_info.desc == "" ? vlan_info.iface : vlan_info.desc;
                        vlan_iface = vlan_info.iface;
                        vlan_id = vlan_info.id;
                        return false;
                    }
                }

            });

            d.each(lan_list, function(lan_index, lan_info){
                if(lan_info.ipaddr == "" || lan_info.netmask == "") return;
                var calc_data = IpSubnetCalculator.calculateCIDRPrefix(lan_info.ipaddr, lan_info.netmask);
                if(dec_ip >= calc_data.ipLow && dec_ip <= calc_data.ipHigh)
                {
                    //this ip is in this vlan_config
                    vlan_name = lan_info.hostname == "" ? lan_info.ifname.toUpperCase() : lan_info.hostname;
                    vlan_iface = lan_info.ifname.toUpperCase();
                    return false;
                }
            });

            this_html += '<td class="src_vlan_id text-left">' + vlan_id +'</td>';
            this_html += '<td class="src_vlan_iface text-left">' + vlan_iface.toUpperCase() +'</td>';
            this_html += '<td class="src_vlan_name text-left">' + vlan_name.toUpperCase() +'</td>';
            this_html += '<td class="src_timestring" text-left >' + m.rest_time_string + '</td>';
            var status = additional_info.status || 'online';
              if(status == 'online')
            {
                this_html +='<td><div class="tooltips dot-blue"><span class="tooltiptext">Online</span><div></td>';
            }
            else if(status == "offline")
            {
                this_html +='<td><div class="tooltips dot-red"><span class="tooltiptext">Offline</span><div></td>';
            }
            else{
                this_html += '<td><div class="tooltips dot-green"><span class="tooltiptext">Inactive</span><div></td>';
            }


            this_html += '<td><a class="table-link"><span class="fa-stack" et="click tap:bindthis"><i class="fa fa-square fa-stack-2x"></i><i title="' + dhcp_list_add_static + '" class="fa fa-link fa-stack-1x fa-inverse"></i></span></a>' +
                '</td>';
            this_html += "<td class='hidden src_arp_real_num'>" + (arp_data.real_num || "") + "</td>"
            this_html += "<td class='hidden src_iface'>" + vlan_iface + "</td>";

            this_html += '</tr>';
        });
        d('#tbody_info').html(this_html);

        d('.input_description').on('blur', function(e){


            var val = d(this).val();
           var macaddr = d(this).parents('tr').find('.src_mac').html();
           var arg = {mac:macaddr, remark:val};
           f.setSHConfig('client_config.php?method=SET&action=client_info2', arg, function (data){
            f.getSHConfig('client_config.php?method=GET&action=client_info2', function(data){
                arpbind_info = data || [];
            },false);
           });
        });

        d('.input_description').on("keyup", function(event) {
            if(event.which == 13) 
            {
               
                d(this).blur();
            }
          });
          
          d('#search_input').on("keyup", function(){
			search_key = d(this).val();
			
			showTableByKeyword();
			
			d('.select_vlan').val('');
			selected_vlan = '';
			b_keyword_selected = true;
			b_vlan_selected = false;
		
		});

        if (status_array.length > 0) {
            this_table = d('#table').DataTable({
                "bDestroy": true,
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": true},
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
                    {"orderable": false}
                ],
                "drawCallback": function () {
                    laber_text(false);
                    d(":checkbox", d('#table_wrapper')).prop('checked', false);
                }
            });
            if(default_num > 0)
                this_table.page.len(default_num).draw();
            else
                this_table.page.len(status_array.length).draw();
        }
        
         showTableByVlan();
    }

    d('#table').on("change", ":checkbox", function () {
        if (d(this).is("[name='checked-all']")) {
            d(":checkbox:enabled", d('#table')).prop("checked", d(this).prop("checked"));
            laber_text(d(this).prop("checked"));
        } else {
            var checkbox = d("tbody :checkbox:enabled", d('#table'));
            d(":checkbox[name='checked-all']", d('#table')).prop('checked', checkbox.length == checkbox.filter(':checked:enabled').length);
            laber_text(checkbox.length == checkbox.filter(':checked:enabled').length);
        }
    }).on("click", ".row-checkbox", function (event) {
        !d(event.target).is(":checkbox") && d(":checkbox", this).trigger("click");
    });

    function laber_text(status) {
        if (status) {
            d("[for='allchecked']").text(disselectall_tab);
        } else {
            d("[for='allchecked']").text(selectall_tab);
        }
    }

    et.displayline = function (evt) {
        if (status_array.length > 0) {
            default_num = d(evt).val();
            if(default_num > 0)
                this_table.page.len(default_num).draw();
            else
                this_table.page.len(status_array.length).draw();
            
            d(evt).blur();
        }
    };
    
    
     function showTableByKeyword() {
	
			d('#tbody_info tr').each(function(){
				var innerText = d(this).text();
				if(search_key == "")
				{
					d(this).show();
					 return;
				}
				if(innerText.toLowerCase().indexOf(search_key.toLowerCase()) > -1) {
					d(this).show();
				}
				else
				{
					d(this).hide();
				}
			});	
	}
    
    function showTableByVlan() {
	
		
		d('#tbody_info tr').each(function(){
				var iface = d(this).find(".src_iface").text();
				if(selected_vlan == "")
				{
					d(this).show();
					 return;
				}
				if(iface != selected_vlan) {
					d(this).hide();
				}
				else
				{
					d(this).show();
				}
			});
	
	}
    
    et.displayvlan = function(evt) {
		selected_vlan = d(evt).val();
		
		showTableByVlan();
		d('#search_input').val('');
		search_key = '';
		b_vlan_selected = true;
		b_keyword_selected = false;
		
	}


    et.refresh_list = function () {
        d('#tbody_info').html('');
        refresh_init();
    };

    et.add_list = function () {
        var a = {}, this_checked;
        a.list = [];
        this_checked = d('#tbody_info').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        this_checked.each(function (n, m) {
            a.list[n] = {};
            a.list[n].ip = d(m).parents('tr').find('.src_ip').html();
            a.list[n].mac = d(m).parents('tr').find('.src_mac').html().toLowerCase();
            a.list[n].commentname = d(m).parents('tr').find('.src_name').html();
            a.list[n].action = 'add';
        });

        set_config(a);
    };

    et.bindthis = function (evt) {
        var a = {};
        a.list = [];
        a.list[0] = {};
        a.list[0].ip = d(evt).parents('tr').find('.src_ip').html();
        a.list[0].mac = d(evt).parents('tr').find('.src_mac').html().toLowerCase();
        a.list[0].commentname = d(evt).parents('tr').find('.src_name').html();
        a.list[0].action = "add";
        set_config(a);
    };

    function set_config(arg) {
        f.setMConfig('static_dhcp', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000)
            }
        });
    }

    function reset_lock_web() {
        lock_web = false;
    }

    b.init = init;
});
