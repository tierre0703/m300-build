//���ļ�����Ҫ�޸�
//�����ǵ�¼���ýű��������༸��·��js�ļ�����

function login(){
	save_ck();	
	setcookie("lfradius_user",$("#user").val(),0);
	setcookie("lfradius_pass",$("#pass").val(),0);
	
	var object=document['_userregistr'];
	if(!object.mianze.checked) {
		showinfo("����ͬ������Э�飡");
		object.mianze.focus();
		return false;
	}
	if(object.user.value=='') {
		showinfo("�������û���");
		object.user.focus();
		return false;
	}
	
	if($('#pass').css('display')=="none") object.password1.value=object.password11.value;
	
	if(object.password1.value=='') {
		showinfo("����������");
		object.password1.focus();
		return false;
	}
	
	object.usrname.value=object.user.value;
	object.passwd.value=object.password1.value;
	
	$("#_userregistr").attr("target","_top"); 
	$("#_userregistr").attr("action",submiturl);
	object.submit();
}

//����
function save_ck(){	
	if($("#save").is(':checked')){
		if($("#user").val().length>0 && $("#pass").val().length>0){
			setcookie("lfradius_cook_user",$("#user").val(),save_time);
			setcookie("lfradius_cook_pass",$("#pass").val(),save_time);
		}
	}else{
		delcookie("lfradius_cook_user");
		delcookie("lfradius_cook_pass");
		$("#auto").attr("checked",false);
	}
	
	if($("#save").is(':checked')){
		setcookie("lfradius_cook_save","true",save_time);
	}else{		
		setcookie("lfradius_cook_save","false",save_time);
	}
	if($("#auto").is(':checked')){
		setcookie("lfradius_cook_auto","true",save_time);
	}else{		
		setcookie("lfradius_cook_auto","false",save_time);
	}	
}
function auto_ck(){
	save_ck();
}

//������Զ���¼
if(getcookie("lfradius_cook_auto")=="false"){
	$("#auto").attr("checked",false);
}
if(getcookie("lfradius_cook_save")=="false"){
	$("#auto").attr("checked",false);
	$("#save").attr("checked",false);
}

if(getcookie("lfradius_cook_save")=="true" && getcookie("lfradius_cook_user")!="" && getcookie("lfradius_cook_pass")!=""){
	$("#save").attr("checked",true);
	$("#user").val(getcookie("lfradius_cook_user"));
	$("#pass").val(getcookie("lfradius_cook_pass"));	
	$("#save").attr("checked", getcookie("lfradius_cook_save"));
	if(getcookie("lfradius_cook_auto")=="true") $("#auto").attr("checked", getcookie("lfradius_cook_auto"));
}
if($("#auto").is(':checked') && getcookie("lfradius_cook_auto")=="true" && time_out>0 && document['_userregistr'].user.value!="" &&  document['_userregistr'].password1.value!=""){
	if (time_out>0){			
		setInterval("autotimeout()",1000);
		setTimeout(autologin,(time_out+1)*1000);
	}else{
		login();
	}
}
//������ȴ�0���Զ���¼������ʾȥ������
if($("#auto").is(':checked') && getcookie("lfradius_cook_auto")=="true" && time_out==0 && document['_userregistr'].user.value!="" &&  document['_userregistr'].password1.value!=""){
	$("body").hide();
	$("body").css('background-color','FFFFFF');
	$("body").css('background-image','url()');
	login();
}

function autologin(){
	if($("#auto").is(':checked') && getcookie("lfradius_cook_auto")=="true"){
		login();
	}else{
		showinfo("");
	}
}
var time_out_ok=time_out;
function autotimeout(time_out1){
	if($("#auto").is(':checked') && getcookie("lfradius_cook_auto")=="true" && time_out_ok>0){
		showinfo("��["+time_out_ok+"]����Զ���¼");
		time_out_ok--;
	}else{
		showinfo("");
	}
}