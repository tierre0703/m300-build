#!/bin/bash
sudo echo "Starting..."
PWD='pwd'
MKSQSHFS4='./mksquashfs4'
PADJFFS2='./padjffs2'
UNSQSHFS='./unsquashfs4'
BINWALK='./binwalk'
# Need to extract file systems as ROOT
if [ "$(id -ru)" != "0" ]
 then
	SUDO="sudo"
else
	SUDO=""
fi


case "$1" in
'extract'|'e')
offset1=`grep -oba hsqs $2 | grep -oP '[0-9]*(?=:hsqs)'`
offset2=`wc -c $2 | grep -oP '[0-9]*(?= )'`
size2=`expr $offset2 - $offset1`

echo $offset1 " " $offset2 " " $size2
dd if=$2 of=kernel.bin bs=1 ibs=1 count=$offset1
dd if=$2 of=secondchunk.bin bs=1 ibs=1 count=$size2 skip=$offset1
${SUDO} rm -rf squashfs-root 2>&1
${SUDO} $UNSQSHFS -d squashfs-root secondchunk.bin
rm secondchunk.bin
;;
'create'|'c')
${SUDO} $MKSQSHFS4 ./squashfs-root ./newsecondchunk.bin -nopad -noappend -root-owned -comp xz -Xpreset 9 -Xe -Xlc 0 -Xlp 2 -Xpb 2 -b 256k -processors 1
${SUDO} chown $USER ./newsecondchunk.bin
cat kernel.bin newsecondchunk.bin > $2
$PADJFFS2 $2
rm newsecondchunk.bin
;;
*)
echo 'run
"modify-firmware.sh extract firmware.bin"
You will find file "kernel.bin" and folder "squashfs-root".
Modify "squashfs-root" as you like,after everything is done,run
"modify-firmware.sh create newfirmware.bin"
And you will get a modified firmware named newfirmware.bin.
'
;;
esac

