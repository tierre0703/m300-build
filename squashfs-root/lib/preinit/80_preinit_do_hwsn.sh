#!/bin/sh

generate_hwsn() {
	local hwsn
	stable_num="434f4d46415354"
	[ -e "/tmp/sysinfo/" ] || mkdir -p "/tmp/sysinfo/"
	
	hwsn=$stable_num`cat /sys/class/net/eth1/address | sed -n "s/://gp"`
	echo $hwsn >> /tmp/sysinfo/hwsn

}


boot_hook_add preinit_mount_root generate_hwsn