//************************
//���ļ��������
//*************************

//ע����ʾ�����Ŀ
if(showsms==1 || useronlyphone==1){
	document.getElementById("user").setAttribute("placeholder","�������ֻ�����");
}

if(showpass2==1) $('#password2').css({display:''});
if(showcode==1) $('#code').css({display:''});
if(showsms==1) $('#smscode').css({display:''});

//�û�ע��
function lf_registrok(){
	save_ck();	
	setcookie("lfradius_user",$("#user").val(),0);
	setcookie("lfradius_pass",$("#pass").val(),0);
	
	var object=document['_userregistr'];
	if(!object.mianze2.checked) {
		showinfo("����ͬ������Э�飡");
		object.mianze2.focus();
		return false;
	}
	if(!_check_user_registr_check()) return false;  //����û��Ƿ�ע���
	if(useronlyphone==1 && !_checkphone()) return false;  //����û����ǲ����ֻ�����
	
	if($('#pass').css('display')=="none") object.password1.value=object.password11.value;
	if($('#pass2').css('display')=="none") object.password2.value=object.password22.value;
	
	if(object.password1.value=='') {
		showinfo("����������");
		object.password1.focus();
		return false;
	}
	if(object.password2.value=='' && showpass2==1) {
		showinfo("������ȷ������");
		object.password2.focus();
		return false;
	}
	if(object.password1.value!=object.password2.value && showpass2==1) {
		showinfo("�����������벻һ��");
		object.password1.focus();
		return false;
	}
	
	if(object.code.value=='' && showcode==1) {
		showinfo("������ͼƬ��֤��");
		object.code.focus();
		return false;
	}
	
	if(object.smscode.value=='' && showsms==1) {
		showinfo("�����������֤��");
		object.smscode.focus();
		return false;
	}
	
	$("#_userregistr").attr("action","http://"+radiusip+"/lfradius/libs/portal/portalweb.php?router="+routetype+"&run=registr_add");
	$("#_userregistr").attr("target","radius"); 
	object.submit();

}

//����ֻ����Ƿ���Ч
function _checkphone(){
	var object=document['_userregistr'];
	var myreg = /^1[0-9]{10}$/; 
	if(!myreg.test(object.user.value)) 
	{ 
		showinfo("�û���������Ч���ֻ����룡");
		object.user.focus();
	    return false; 
	}	
    return true; 
}

//��ʱ�ط�����
var countdown=5; 
function settime(val) { 
	if (countdown == 0) { 
		val.removeAttribute("disabled");    
		val.value="����..."; 
		countdown=5; 
		return 1;
	} else {
		val.setAttribute("disabled", true); 
		val.value="(" + countdown + ")..."; 
		countdown--; 
	} 
setTimeout(function(){settime(val)},1000);
} 

//���ȷ�����Ͷ���
function sendsms(){
	var object=document['_userregistr'];
	if(!_checkphone()) return false; //����ֻ����Ƿ���Ч
	if(!_check_user_registr_check()) return false;  //����û��Ƿ�ע���
	
	document['_userregistr_sms'].user.value=object.user.value;
	document['_userregistr_sms'].code.value=object.code.value;
	settime(object.smsok);
	$('#_userregistr_sms').submit();
}

/*************ȡ�û����Ƿ�ע���***********/
function _getuser(str) {
	try {
		if(window.XMLHttpRequest){
			var xmlhttp=new XMLHttpRequest();
		}else{
			var xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
		}
		xmlhttp.open("GET","http://"+radiusip+"/lfradius/home.php?c=login&a=get_user&user="+encodeURI(str),false);
		xmlhttp.send();
		var value=xmlhttp.responseText;
	}catch (e) {
		return 0;
	}	
	
	if(value=="1"){
		value="1";
	}else{
		value="0";
	}
	return value;
}
/***************����û�ע���޸�ҳ��***********/
function _check_user_registr_check()
{
	var object=document['_userregistr'];
	if(object.user.value=='')
	{
		showinfo("<span style='color:#FF0000'>�û�������Ϊ�գ�</span>");
		object.user.focus();
		return false;
	}
	if(_getuser(object.user.value)=='1')
	{
		showinfo("����û����Ѿ���ʹ�û򲻺Ϲ棡");
		object.user.focus();
		return false;
	}
	if(!_check_username(object.user.value))
	{
		showinfo("�û����벻Ҫʹ��һЩ���Ϲ��ַ���");
		object.user.focus();
		return false;
	}
	if(object.user.value.length<4 || object.user.value.length>32)
	{
		showinfo("�û�����������Ҫ4λ�����ܳ���30λ��");
		object.user.focus();
		return false;
	}
	showinfo("<span style='font-weight:900;color:#0000FF'>�û�������ʹ�ã�</span>");
	return true;
}
/***************���˷Ƿ��ַ�***********/
function _check_username(str){
	var i,j,k,strTemp;
	strTemp=" `~#$%^&*()+={};'/\\<>\";:";
	k=1;
	if ( str.length== 0){
		k=0;
	}else{
		for (i=0;i<str.length;i++){
		j=strTemp.indexOf(str.charAt(i)); 
			if (j>=0){
				k=0;
			}
		}
	}
	return k;
}

/***************��ʾ��ʾ***********/
function showinfo(str){
	document.getElementById('errorinfo').innerHTML="<span style='font-weight:900;color:#FF0000'>"+str+"<br /></span>";
}
















//дcookies
function setcookie(name,value,shours){	
	if(shours!==0){
		var Dhours = shours;
		var exp  = new Date();
		exp.setTime(exp.getTime() + Dhours*3600*1000);
		document.cookie = name + "="+ escape (value) + ";expires=" + exp.toGMTString();
	}else{
		document.cookie = name + "="+ escape (value);
	}
	
}
//ȡcookies
function getcookie(name){
    var arr = document.cookie.match(new RegExp("(^| )"+name+"=([^;]*)(;|$)"));
     if(arr != null) return unescape(arr[2]); return null;

}
//ɾ��cookie
function delcookie(name){
    setcookie(name, "", -1);  
}

//ȡ��ַ��URL
function geturl_request(str) { 
	if(str === undefined){
		var url = window.location.search; //��ȡurl��"?"������ִ�
	}else{
		var url=str;
	}
	var therequest = new Object(); 
	if (url.indexOf("?") != -1) { 
	var str = url.substr(1); 
	strs = str.split("&"); 
		for(var i = 0; i < strs.length; i ++) { 
			therequest[strs[i].split("=")[0]]=unescape(strs[i].split("=")[1]); 
		} 
	}
	return therequest; 
}

//����base64����
function base64_decode(str){
	var c1, c2, c3, c4;
	var base64DecodeChars = new Array(
		-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		-1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57,
		58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6,
		7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
		25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
		37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1,
		-1, -1
	);
	var i=0, len = str.length, string = '';

	while (i < len){
		do{
			c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff]
		} while (
			i < len && c1 == -1
		);

		if (c1 == -1) break;

		do{
			c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff]
		} while (
			i < len && c2 == -1
		);

		if (c2 == -1) break;

		string += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

		do{
			c3 = str.charCodeAt(i++) & 0xff;
			if (c3 == 61)
				return string;

			c3 = base64DecodeChars[c3]
		} while (
			i < len && c3 == -1
		);

		if (c3 == -1) break;

		string += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));

		do{
			c4 = str.charCodeAt(i++) & 0xff;
			if (c4 == 61) return string;
			c4 = base64DecodeChars[c4]
		} while (
			i < len && c4 == -1
		);

		if (c4 == -1) break;

		string += String.fromCharCode(((c3 & 0x03) << 6) | c4)
	}
	return string;
}

