
//��ע���޸ı�Ĵ���
/*
//·�����ͣ��ֱ�Ϊ panabit ros wayos ikuai
//��Ӧ�������أ�MikroTik_RouterOS ά�� �������ĸ�·��
//routetype

//ģ���ļ�����
//pathname

//ҳ��title������
//title

//��ϵ�绰��������ʾ��
//phone ֻ��ʾ����ʾ�����һ���ֻ���ֱ�Ӱδ�phone_call
//phone_call�ܱ��ֻ�ֱ�Ӱδ���ֻ��һ�������绰��
//phone
//phone_call

//��ϵ��ַ��������ʾ
//address

//radius��IP�������������������Ҫ��http://Ҳ��Ҫ��/��β
//radiusip

//radius�������������������Ҫ��http://Ҳ��Ҫ��/��β
//���Ŀǰֻ��PA��Ҫ���ã����಻��Ҫ��
//domain

//successhref ���߳ɹ������ת��վ
//successhref

//�Զ��ύ�ĵȴ�ʱ�䣬��λ����
//time_out

//�����˺���Ϣ��ʱ�䣬��λ��Сʱ��Ĭ�ϳ��ڱ���
//save_time

//ע�����û���NASID��
//nasid

//����ʱ�����⵽�Ѿ������������ߣ�1������0������
//offline

//�Ƿ���ʾע�ᰴť
//registr_button_show

//��¼��ť�ı���ʾ
//login_button_text

//�û�ע�ᰴť�ı���ʾ
//registr_button_text

*/

				
var routetype="ros";
var pathname="ros";
var title="������֤ϵͳ";
var phone="13800138000";
var phone_call="13800138000";
var address="��һ������û�����ַ";
var radiusip="6.6.6.101";
var domain="";
var successhref="http://hao.360.cn";
var time_out=5;
var save_time=24000;
var nasid="1";
var offline="1";
var registr_button_show=1;
var login_button_text="�û���¼";
var registr_button_text="û���˺ţ�����ע��";
























//==============����ֵ���øģ�����ϵͳ���ýű�ʶ������==================
//������ҳ��ʾ�Ĵ�С�Ӵ���С��½�����ʾ
function lf_dwidth(){
	try {
		if(document.body.scrollWidth>800){
			document.body.style.width="800px";
			document.getElementById("footer").style.width="800px";
		}else{
			document.body.style.width="100%";
			document.getElementById("footer").style.width="100%";
		}
	}catch(e){return 0;}
}
lf_dwidth();
$(window).resize(function(){lf_dwidth()});


if(!window.navigator.cookieEnabled){
   alert("Cookie�����ã�ƻ���ֻ��������ã���������Safari����ֹCookeѡ�ѡ��ʼ������");
}
if(domain=="" && radiusip==""){
	radiusip=window.location.host;
}
if(domain=="") domain=radiusip;
if(radiusip=="") radiusip=domain;
document.title = title;

document.write("<link rel='stylesheet' type='text/css' href='css/main.css?time="+Date.parse(new Date())+"'>");
if(window.location.pathname.substr(-12)=="/server.html") document.write("<s"+"cript type='text/javascript' src='http://"+radiusip+"/lfradius/libs/portal/webjs.php?run=serverlist&nasid="+nasid+"&time="+Date.parse(new Date())+"'></scr"+"ipt>");
document.write("<s"+"cript type='text/javascript' src='http://"+radiusip+"/lfradius/libs/portal/webjs.php?run=setting&time="+Date.parse(new Date())+"'></scr"+"ipt>");
document.write("<s"+"cript type='text/javascript' src='js/content.js?time="+Date.parse(new Date())+"'></scr"+"ipt>");
document.write("<s"+"cript type='text/javascript' src='js/global.js?time="+Date.parse(new Date())+"'></scr"+"ipt>");
document.write("<s"+"cript type='text/javascript' src='js/route/"+routetype+".js?time="+Date.parse(new Date())+"'></scr"+"ipt>");