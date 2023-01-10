
#!/bin/sh

x86_board_detect() {
	local wan_mac
	local lan_mac
	local lan_ifname
	local port_sum
	local port_list
	local port_sum
	local vlan_support=1
	local vlan_min="2"
	local vlan_max="4094"
	local vlan_board_type="line"
	local vlan_qinq_support="1"
	local vlan_multiple_port="1"
	local vlan_wireless="0"
	local vlan_switch="0"
	local vlan_port_t="0"
	local ip
	local reboot_time
	local factory_time
	local upgrade_time
	local multi_pppoe_num
	local mlan=1
	local mwan=1
	local ac_mode=1
	local ssid_vid_min='4'
	local ssid_vid_max='127'

	wan_mac=$(cat /sys/class/net/eth0/address)
	eth1_mac=$(cat /sys/class/net/eth1/address)
	eth2_mac=$(cat /sys/class/net/eth2/address)
	eth3_mac=$(cat /sys/class/net/eth3/address)
	eth4_mac=$(cat /sys/class/net/eth4/address)
	eth5_mac=$(cat /sys/class/net/eth5/address)
	if [ -n "$eth5_mac" ];then
		port_list="eth0,eth1,eth2,eth3,eth4,eth5,"
		ifname_list="eth0,eth1,eth2,eth3,eth4,eth5,"
		port_sum=6
		lan_mac=$eth5_mac
	elif [ -n "$eth4_mac" ];then
		port_list="eth0,eth1,eth2,eth3,eth4,"
		ifname_list="eth0,eth1,eth2,eth3,eth4,"
		port_sum=5
		lan_mac=$eth4_mac
	elif [ -n "$eth3_mac" ];then
		port_list="eth0,eth1,eth2,eth3,"
		ifname_list="eth0,eth1,eth2,eth3,"
		port_sum=4
		lan_mac=$eth3_mac
	elif [ -n "$eth2_mac" ];then
		port_list="eth0,eth1,eth2,"
		ifname_list="eth0,eth1,eth2,"
		port_sum=3
		lan_mac=$eth2_mac
	elif [ -n "$eth1_mac" ];then
		port_list="eth0,eth1,"
		ifname_list="eth0,eth1,"
		port_sum=2
		lan_mac=$eth1_mac
	fi
	ip="10.10.11.1"
	reboot_time="50"
	factory_time="50"
	upgrade_time="80"
	multi_pppoe_num="6"
	[ -e "/tmp/sysinfo/" ] || mkdir -p "/tmp/sysinfo/"
	echo cf-ac300 > /tmp/sysinfo/board_name
	local modelname="COMFAST CF-AC300"
	echo $modelname > /tmp/sysinfo/model
	echo "434f4d46415354" > /tmp/sysinfo/uniap_hwsn
	echo $lan_mac > /tmp/sysinfo/mac
	hwrev=$(cat /etc/defconfig/cf-ac300/version)
	echo $hwrev > /tmp/sysinfo/hwrev
	local def_wan=eth0
	touch /tmp/sysinfo/noswitch
	[ -n "$def_wan" ] && [ -n "$port_sum" ] && [ -n "$port_list" ] && [ -n "$ifname_list" ] && {
		echo -e "def_wan=${def_wan}\nport_sum=${port_sum}\nport_list=${port_list}\nifname_list=${ifname_list}" >> /tmp/sysinfo/port_info
	}
	[ -n "$ip" ] && [ -n "$reboot_time" ] && [ -n "$factory_time" ] && [ -n "$upgrade_time" ] && {
		echo -e "ip:${ip}\nreboot_time:${reboot_time}\nfactory_time:${factory_time}\nupgrade_time:${upgrade_time}" > /tmp/sysinfo/common_config
	}
	[ -n "$multi_pppoe_num" ] && {
		echo -e "multi_pppoe_num:${multi_pppoe_num}" >> /tmp/sysinfo/common_config
	}
	[ -n "$vlan_support" ] && {
		echo -e "vlan_min=${vlan_min}\nvlan_max=${vlan_max}\nvlan_board_type=${vlan_board_type}\nvlan_qinq_support=${vlan_qinq_support}" > /tmp/sysinfo/vlan
		echo -e "vlan_multiple_port=${vlan_multiple_port}\nvlan_wireless=${vlan_wireless}\nvlan_switch=${vlan_switch}\nvlan_port_t=${vlan_port_t}" >> /tmp/sysinfo/vlan
		echo -e "ssid_vid_min=${ssid_vid_min}\nssid_vid_max=${ssid_vid_max}" >> /tmp/sysinfo/ssid_vid
	}
	[ -n "$mlan" ] && echo -e "$mlan" > /tmp/sysinfo/mlan
	[ -n "$mwan" ] && echo -e "$mwan" > /tmp/sysinfo/mwan
	[ -n "$ac_mode" ] && echo -e "$ac_mode" > /tmp/sysinfo/ac_mode
	[ -b "/dev/sda3" ] && echo "x86 /dev/sda3" > /tmp/sysinfo/dev_configs
}
