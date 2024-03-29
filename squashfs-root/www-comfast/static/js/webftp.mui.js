/*!
 * static/js/webftp.nfs.js
 * MUI界面
 */
;
(function (window, app, $, undefined) {
	var mui = {
		thumb : true,
		olist : false,
		otype : 'name',
		osort : 'desc'
	};

	// 初始化UI布局
	mui.init = function () {
		app.log('app.mui.init:', new Date().getTime());

		this.bindHotKeys();
	};

	// 界面刷新
	mui.refresh = function (force) {
		app.log('app.mui.refresh');
		if (!force) {
			this.initToolBar();
			this.initLeftMenu();
			this.initContextMenu();
			this.loading(0);
		} else {
			app.nfs.nlist(app.nfs.cpath, true);
		}
	};

	mui.loading = function (on) {
		if (on)
			$('#loading').show();
		else
			$('#loading').hide();
	};

	// 左侧主菜单
	mui.initLeftMenu = function () {
		$('#main-menu').find('li').hover(function () {
			$(this).addClass('focus');
		}, function () {
			$(this).removeClass('focus');
		});

		var ch = $('#list_main_center').outerHeight();
		$('#list_main_left').height(ch);
		$('#list_main_right').height(ch);
	}

	// 工具栏
	mui.initToolBar = function () {
		$('#tool_sort').hover(function () {
			$('#drop_sort').hide().show();
		}, function () {});
		$('#drop_sort').hover(function () {}, function () {
			$('#drop_sort').hide();
		});

		// 文件列表排序类型
		$('#list_order_type_' + this.otype).addClass('checked');
		$('.list_order_type').click(function () {
			$('.list_order_type').removeClass('checked');
			app.mui.otype = $(this).addClass('checked').attr('data-type');
			app.nfs.nlist(app.nfs.cpath, true);
		});

		// 文件列表排序方式
		$('#list_order_sort_' + this.osort).addClass('checked');
		$('.list_order_sort').click(function () {
			$('.list_order_sort').removeClass('checked');
			app.mui.osort = $(this).addClass('checked').attr('data-sort');
			app.nfs.nlist(app.nfs.cpath, true);
		});
	}

	// 绑定快捷键
	mui.bindHotKeys = function () {
		$(document).keydown(function (e) {
			var stopPP = false;
			if (e.ctrlKey && 65 == e.keyCode) {
				app.mui.SelectAll();
				stopPP = true;
			} else if (e.ctrlKey && 88 == e.keyCode) { //Ctrl+X
				app.nfs.cut(false);
				stopPP = true;
			} else if (e.ctrlKey && 67 == e.keyCode) { //Ctrl+C
				app.nfs.copy(false);
				stopPP = true;
			} else if (e.ctrlKey && 86 == e.keyCode) { //Ctrl+V
				app.nfs.paste(false);
				stopPP = true;
			} else if (e.ctrlKey && 83 == e.keyCode) { //Ctrl+S
				app.mui.olist = !app.mui.olist;
				app.nfs.nlist(app.nfs.cpath, false);
				stopPP = true;
			} else if (e.ctrlKey && 68 == e.keyCode) { //Ctrl+D
				app.nfs.rmdir(false);
				stopPP = true;
			}

			if (stopPP) {
				e.stopPropagation();
				return false;
			}
		});
	};

	// 显示文件列表
	mui.display = function (data) {
		data.nfs = window.nfs;
		app.log('app.mui.display', data);

		// 解析路径菜单
		var paths = data.path.current.slice(0, -1).split('/');
		$.each(paths, function (idx, name) {
			if (0 == idx) {
				paths[0] = {
					'name' : '根目录',
					'path' : '/'
				};
			} else {
				paths[idx] = {
					'name' : name,
					'path' : paths[idx - 1].path + name + '/'
				};
			}
		});
		var html = juicer('#nlist-path', {
				'paths' : paths
			});
		$('#list_head').html(html);

		// 生成文件列表
		if (!this.olist) {
			var html = juicer('#nlist-icon', data);
			$('#list_main_center').html(html);

			//图片预览
			if (this.thumb) {
				$('#list_main_center div').each(function (idx) {
					var $show = $('ol:first', $(this)).find("a[rel='show']");
					var path = $show.attr('data-path'),
					time = $show.attr('data-mtime');
					$show.find('div').css('background-image', 'url("webftp.php?mod=nfs&act=thumb&fs-path=' + path + '&_t=' + time + '")');
				});
			}
		} else {
			var html = juicer('#nlist-list-table', {});
			$('#list_main_center').html(html);

			var html = juicer('#nlist-list-main', data);
			$("tbody[id='dirs-files-list']").html(html);
		}

		// 图片绑定 ColorBox
		$("#list a[rel^='show']").on('click', function (event) {
			$("#list a[rel^='show']").colorbox({
				slideshow : true,
				transition : "elastic",
				width : "80%",
				height : "90%",
				bgOpacity : 0.5,
				preloading : true
			});
		});

		this.refresh();
	};

	// 上下文菜单
	mui.initContextMenu = function () {
		var clip;
		// app.log('app.mui.initContextMenu');
		var dmOption = {
			mid : '#contextDirMenu',
			width : 151,
			items : [{
					text : '打开目录',
					icon : 'folder_open',
					alias : 'nfs-dir-alist',
					action : function ($dom) {
						app.nfs.nlist($dom.attr('data-path'));
					}
				}, {
					text : '重命名',
					icon : 'folder_rename',
					alias : 'nfs-dir-rename',
					action : function ($dom) {
						app.nfs.rename($dom, $dom.attr('data-path'), $dom.attr('data-name'), 'dir');
					}
				}
			],
			onShow : function (menu) {
				var items = [];

				if (!app.nfs.auth('rename')) {
					items.push('nfs-dir-rename');
				}
				if (!app.nfs.auth('paste')) {
					items.push('nfs-dir-cut', 'nfs-dir-copy');
				}
				if (!app.nfs.auth('rmdir')) {
					items.push('nfs-dir-delete');
				}
				if (!app.nfs.auth('chmod')) {
					items.push('nfs-dir-chmod');
				}
				if (!app.nfs.auth('download')) {
					items.push('nfs-dir-down');
				}
				if (!app.nfs.auth('zip')) {
					items.push('nfs-dir-zip');
				}

				menu.applyrule({
					name : this.id,
					disable : true,
					items : items
				});

			}
		};

		var fmOption = {
			mid : '#contextFileMenu',
			width : 152,
			items : [{
					text : '打开文件',
					icon : 'folder_open',
					alias : 'nfs-file-alist',
					action : function () {}
				}, {
					text : '重命名',
					icon : 'file_rename',
					alias : 'nfs-file-rename',
					action : function ($dom) {
						app.nfs.rename($dom, $dom.attr('data-path'), $dom.attr('data-name'), 'file');
					}
				}, {
					text : '复制地址',
					icon : 'file_share',
					alias : 'nfs-file-uri',
					action : function ($dom) {
						clip.setText( $dom.attr('data-path') );
						//app.nfs.rename($dom, $dom.attr('data-path'), $dom.attr('data-name'), 'file');
					}
				}, {
					text : '删除文件',
					icon : 'file_delete',
					alias : 'nfs-file-delete',
					action : function ($dom) {
						app.nfs.rmdir($dom.attr('data-path'), $dom.attr('data-name'), 'file');
					}
				}, {
					text : '下载文件',
					icon : 'file_down',
					alias : 'nfs-file-down',
					action : function ($dom) {
						app.nfs.download($dom.attr('data-path'), $dom.attr('data-name'), 'file');
					}
				}
			],
			onShow : function (menu) {
				var items = [];

				if (!app.nfs.auth('rename')) {
					items.push('nfs-file-rename');
				}
				if (!app.nfs.auth('paste')) {
					items.push('nfs-file-cut', 'nfs-file-copy');
				}
				if (!app.nfs.auth('rmdir')) {
					items.push('nfs-file-delete');
				}
				if (!app.nfs.auth('chmod')) {
					items.push('nfs-file-chmod');
				}
				if (!app.nfs.auth('download')) {
					items.push('nfs-file-down');
				}

				menu.applyrule({
					name : this.id,
					disable : true,
					items : items
				});
				
				
				
				// 复制访问地址
				var path = $(this).attr('data-path');
				ZeroClipboard.config( { moviePath: 'static/plugins/ZeroClipboard/ZeroClipboard.swf', debug: false } );
				clip = new ZeroClipboard($(menu).find('div:contains("复制地址")'));
				clip.setHandCursor( true ); // 设置鼠标为手型 
				// clip.setCSSEffects( true ); 
				// console.dir( clip );
				
				clip.on( 'dataRequested', function (client, args) {
					clip.setText( window.nfs.host + window.nfs.path.substr(0, window.nfs.path.length-1) +  path);
				});
				
				clip.on('complete', function (client, args) {  
					// console.log("Copied text to clipboard: " + args.text);  
				});  

			}
		};

		$("a[id^='dir-id-']").contextmenu(dmOption);
		$("a[id^='file-id-']").contextmenu(fmOption);
	};

	mui.logout = function () {
		art.dialog.confirm('确定退出 ?', function () {
			document.location.href = 'login.html';
		}, function () {
			art.dialog.tips('操作取消');
		});
	}

	mui.resetpass = function () {
		var $dialog = $.dialog.prompt('请输入新密码：', function (val) {
				if (5 > $.trim(val).length) {
					$.dialog.alert('Sorry, 密码长度不能小于5位!', 'error');
					return false;
				}

				app.ajaxRequest('auth', 'resetpasswd', {
					'newpasswd' : val
				}, function (json) {
					$.dialog.alert(json.message, function () {
						if (200 == json.code)
							location.href = 'login.html';
					});
				}, false, 'login.html');

				return false;
			}, '');

	};

	//文件全选
	mui.SelectAll = function () {
		$(":input[name='dir-checkbox']").each(function () {
			$(this).attr('checked', !$(this).attr('checked'));
		});
		$(":input[name='file-checkbox']").each(function () {
			$(this).attr('checked', !$(this).attr('checked'));
		});
	}

	//文件全选
	mui.SelectCheck = function () {
		var data = [];
		$(":input[name='dir-checkbox']").each(function () {
			var path = $(this).attr('value');
			if ($(this).attr('checked')) {
				data.push(path);
			}
		});
		$(":input[name='file-checkbox']").each(function () {
			var path = $(this).attr('value');
			if ($(this).attr('checked')) {
				data.push(path);
			}
		});
		return data;
	}

	app.mui = mui;
})(window, app, jQuery);
